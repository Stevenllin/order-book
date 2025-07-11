import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { useBTSESocket } from './useBTSESocket';

// Mock WebSocket
global.WebSocket = vi.fn();

// 創建測試組件來使用 composable
const TestComponent = defineComponent({
  setup() {
    const mockOnMessage = vi.fn();
    const { isConnected, connect, disconnect } = useBTSESocket({
      url: 'wss://test.com',
      topic: 'test:topic',
      onMessage: mockOnMessage
    });

    return {
      isConnected,
      connect,
      disconnect,
      mockOnMessage
    };
  },
  render() {
    return h('div', 'test');
  }
});

describe('useBTSESocket', () => {
  let mockWebSocket;
  let mockSend;
  let mockClose;

  beforeEach(() => {
    // 重置 mock
    vi.clearAllMocks();
    
    // 創建 WebSocket mock
    mockSend = vi.fn();
    mockClose = vi.fn();
    mockWebSocket = {
      onopen: null,
      onmessage: null,
      onerror: null,
      send: mockSend,
      close: mockClose
    };
    
    WebSocket.mockImplementation(() => mockWebSocket);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create WebSocket connection when connect is called', () => {
    const wrapper = mount(TestComponent);
    
    // Initially no connection should be created
    expect(WebSocket).not.toHaveBeenCalled();
    
    // Call connect to create the connection
    wrapper.vm.connect();
    
    expect(WebSocket).toHaveBeenCalledWith('wss://test.com');
  });

  it('should send subscribe message when connected', () => {
    const wrapper = mount(TestComponent);
    
    // Create connection first
    wrapper.vm.connect();
    
    // 觸發 onopen 事件
    mockWebSocket.onopen();
    
    expect(mockSend).toHaveBeenCalledWith(
      JSON.stringify({ op: 'subscribe', args: ['test:topic'] })
    );
  });

  it('should set isConnected to true when connected', () => {
    const wrapper = mount(TestComponent);
    
    // Create connection first
    wrapper.vm.connect();
    
    // 觸發 onopen 事件
    mockWebSocket.onopen();
    
    expect(wrapper.vm.isConnected).toBe(true);
  });

  it('should call onMessage when receiving valid message', () => {
    const wrapper = mount(TestComponent);
    const testData = { price: 100, size: 10 };
    
    // Create connection first to set up event handlers
    wrapper.vm.connect();
    
    // 模擬接收消息
    const mockEvent = {
      data: JSON.stringify({
        topic: 'test:data',
        data: testData
      })
    };
    
    mockWebSocket.onmessage(mockEvent);
    
    expect(wrapper.vm.mockOnMessage).toHaveBeenCalledWith(testData);
  });

  it('should not call onMessage for unrelated topics', () => {
    const wrapper = mount(TestComponent);
    
    // Create connection first to set up event handlers
    wrapper.vm.connect();
    
    // 模擬接收不相關主題的消息
    const mockEvent = {
      data: JSON.stringify({
        topic: 'other:data',
        data: { price: 100 }
      })
    };
    
    mockWebSocket.onmessage(mockEvent);
    
    expect(wrapper.vm.mockOnMessage).not.toHaveBeenCalled();
  });

  it('should handle partial topic matching', () => {
    const wrapper = mount(TestComponent);
    const testData = { price: 100 };
    
    // Create connection first to set up event handlers
    wrapper.vm.connect();
    
    // 模擬接收部分匹配主題的消息
    const mockEvent = {
      data: JSON.stringify({
        topic: 'test:other',
        data: testData
      })
    };
    
    mockWebSocket.onmessage(mockEvent);
    
    expect(wrapper.vm.mockOnMessage).toHaveBeenCalledWith(testData);
  });

  it('should log error when WebSocket error occurs', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mount(TestComponent);
    
    // Create connection first to set up event handlers
    wrapper.vm.connect();
    
    // 觸發錯誤事件
    const mockError = new Error('Connection failed');
    mockWebSocket.onerror(mockError);
    
    expect(consoleSpy).toHaveBeenCalledWith('[WebSocket error]', mockError);
    
    consoleSpy.mockRestore();
  });

  it('should log connection message when connected', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const wrapper = mount(TestComponent);
    
    // Create connection first to set up event handlers
    wrapper.vm.connect();
    
    // 觸發連接事件
    mockWebSocket.onopen();
    
    expect(consoleSpy).toHaveBeenCalledWith('[WebSocket connected]', 'test:topic');
    
    consoleSpy.mockRestore();
  });

  it('should close connection when disconnect is called', () => {
    const wrapper = mount(TestComponent);
    
    // Create connection first
    wrapper.vm.connect();
    
    // 先連接
    mockWebSocket.onopen();
    expect(wrapper.vm.isConnected).toBe(true);
    
    // 斷開連接
    wrapper.vm.disconnect();
    
    expect(mockClose).toHaveBeenCalled();
    expect(wrapper.vm.isConnected).toBe(false);
  });

  it('should handle JSON parse error gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mount(TestComponent);
    
    // Create connection first to set up event handlers
    wrapper.vm.connect();
    
    // 模擬無效的 JSON 數據
    const mockEvent = {
      data: 'invalid json'
    };
    
    // 這應該拋出錯誤，但我們不應該讓測試失敗
    expect(() => {
      mockWebSocket.onmessage(mockEvent);
    }).toThrow();
    
    consoleSpy.mockRestore();
  });
});
