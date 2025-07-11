import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { OrderSide } from '../enums/order/OrderSide';
import { StatusChangeEnum } from '../enums/system/StatusChangeEnum';

// Mock modules
vi.mock('./useBTSESocket', () => ({
  useBTSESocket: vi.fn()
}));

vi.mock('../../config/env', () => ({
  config: {
    websocket: {
      orderBook: {
        url: 'wss://test.com',
        topic: 'test:topic'
      },
      tradeHistory: {
        url: 'wss://test.com',
        topic: 'test:topic'
      }
    },
    display: {
      maxOrderBookEntries: 8
    }
  }
}));

// Import mocked modules
import { useBTSESocket } from './useBTSESocket';
import { useTradeHistory } from './useTradeHistory';

// 創建測試組件來使用 composable
const TestComponent = defineComponent({
  setup() {
    const tradeHistoryComposable = useTradeHistory();
    return tradeHistoryComposable;
  },
  render() {
    return h('div', 'test');
  }
});

describe('useTradeHistory', () => {
  let mockConnectTradeHistory;
  let mockDisconnectTradeHistory;
  let mockOnMessage;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useBTSESocket
    mockConnectTradeHistory = vi.fn();
    mockDisconnectTradeHistory = vi.fn();
    mockOnMessage = vi.fn();
    
    useBTSESocket.mockImplementation(({ onMessage }) => {
      mockOnMessage = onMessage;
      return {
        connect: mockConnectTradeHistory,
        disconnect: mockDisconnectTradeHistory
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with loading state', () => {
    const wrapper = mount(TestComponent);
    
    expect(wrapper.vm.isLoading).toBe(true);
    expect(wrapper.vm.currentTrade).toBeNull();
    expect(wrapper.vm.previousTrade).toBeNull();
  });

  it('should connect to WebSocket when connectTradeHistory is called', () => {
    const wrapper = mount(TestComponent);
    
    wrapper.vm.connectTradeHistory();
    
    expect(mockConnectTradeHistory).toHaveBeenCalled();
  });

  it('should disconnect from WebSocket when disconnectTradeHistory is called', () => {
    const wrapper = mount(TestComponent);
    
    wrapper.vm.disconnectTradeHistory();
    
    expect(mockDisconnectTradeHistory).toHaveBeenCalled();
  });

  it('should process first trade correctly', async () => {
    const wrapper = mount(TestComponent);
    
    const tradeMessage = {
      data: [{
        price: '50000',
        side: 'BUY',
        size: '10',
        symbol: 'BTCPFC',
        timestamp: '1640995200000',
        tradeId: 12345
      }]
    };
    
    // Simulate receiving first trade
    mockOnMessage(tradeMessage);
    await nextTick();
    
    expect(wrapper.vm.isLoading).toBe(false);
    expect(wrapper.vm.currentTrade).toEqual({
      price: 50000,
      side: OrderSide.BUY,
      size: 10,
      symbol: 'BTCPFC',
      timestamp: 1640995200000,
      tradeId: 12345
    });
    expect(wrapper.vm.previousTrade).toBeNull();
  });

  it('should process single trade update correctly', async () => {
    const wrapper = mount(TestComponent);
    
    // Send first trade
    const firstTrade = {
      data: [{
        price: '50000',
        side: 'BUY',
        size: '10',
        symbol: 'BTCPFC',
        timestamp: '1640995200000',
        tradeId: 12345
      }]
    };
    
    mockOnMessage(firstTrade);
    await nextTick();
    
    // Send second trade
    const secondTrade = {
      data: [{
        price: '50100',
        side: 'SELL',
        size: '10',
        symbol: 'BTCPFC',
        timestamp: '1640995260000',
        tradeId: 12346
      }]
    };
    
    mockOnMessage(secondTrade);
    await nextTick();
    
    expect(wrapper.vm.currentTrade).toEqual({
      price: 50100,
      side: OrderSide.SELL,
      size: 10,
      symbol: 'BTCPFC',
      timestamp: 1640995260000,
      tradeId: 12346
    });
    
    expect(wrapper.vm.previousTrade).toEqual({
      price: 50000,
      side: OrderSide.BUY,
      size: 10,
      symbol: 'BTCPFC',
      timestamp: 1640995200000,
      tradeId: 12345
    });
  });

  it('should process multiple trades correctly when no current trade exists', async () => {
    const wrapper = mount(TestComponent);
    
    // Ensure no existing trade before sending multiple trades
    expect(wrapper.vm.currentTrade).toBeNull();
    
    const multipleTrades = {
      data: [
        {
          price: '50000',
          side: 'BUY',
          size: '10',
          symbol: 'BTCPFC',
          timestamp: '1640995200000',
          tradeId: 12345
        },
        {
          price: '50100',
          side: 'SELL',
          size: '10',
          symbol: 'BTCPFC',
          timestamp: '1640995260000',
          tradeId: 12346
        },
        {
          price: '50200',
          side: 'BUY',
          size: '5',
          symbol: 'BTCPFC',
          timestamp: '1640995320000',
          tradeId: 12347
        }
      ]
    };
    
    mockOnMessage(multipleTrades);
    await nextTick();
    
    // When multiple trades are received and no current trade exists, only the first one is set as current
    expect(wrapper.vm.currentTrade).toEqual({
      price: 50000,
      side: OrderSide.BUY,
      size: 10,
      symbol: 'BTCPFC',
      timestamp: 1640995200000,
      tradeId: 12345
    });
    
    expect(wrapper.vm.previousTrade).toBeNull();
  });

  it('should process multiple trades correctly when current trade exists', async () => {
    const wrapper = mount(TestComponent);
    
    // First, send a single trade to establish current trade
    const firstTrade = {
      data: [{
        price: '49900',
        side: 'BUY',
        size: '1.0',
        symbol: 'BTCPFC',
        timestamp: '1640995100000',
        tradeId: 12344
      }]
    };
    
    mockOnMessage(firstTrade);
    await nextTick();
    
    // Verify current trade is set
    expect(wrapper.vm.currentTrade).toBeDefined();
    
    // Now send multiple trades
    const multipleTrades = {
      data: [
        {
          price: '50000',
          side: 'BUY',
          size: '10',
          symbol: 'BTCPFC',
          timestamp: '1640995200000',
          tradeId: 12345
        },
        {
          price: '50100',
          side: 'SELL',
          size: '10',
          symbol: 'BTCPFC',
          timestamp: '1640995260000',
          tradeId: 12346
        }
      ]
    };
    
    mockOnMessage(multipleTrades);
    await nextTick();
    
    // When multiple trades are received and current trade exists, first becomes previous, second becomes current
    expect(wrapper.vm.currentTrade).toEqual({
      price: 50100,
      side: OrderSide.SELL,
      size: 10,
      symbol: 'BTCPFC',
      timestamp: 1640995260000,
      tradeId: 12346
    });
    
    expect(wrapper.vm.previousTrade).toEqual({
      price: 50000,
      side: OrderSide.BUY,
      size: 10,
      symbol: 'BTCPFC',
      timestamp: 1640995200000,
      tradeId: 12345
    });
  });

  it('should handle array format message', async () => {
    const wrapper = mount(TestComponent);
    
    const arrayMessage = [{
      price: '50000',
      side: 'BUY',
      size: '10',
      symbol: 'BTCPFC',
      timestamp: '1640995200000',
      tradeId: 12345
    }];
    
    mockOnMessage(arrayMessage);
    await nextTick();
    
    expect(wrapper.vm.currentTrade).toEqual({
      price: 50000,
      side: OrderSide.BUY,
      size: 10,
      symbol: 'BTCPFC',
      timestamp: 1640995200000,
      tradeId: 12345
    });
  });

  it('should handle empty data gracefully', async () => {
    const wrapper = mount(TestComponent);
    
    const emptyMessage = { data: [] };
    
    mockOnMessage(emptyMessage);
    await nextTick();
    
    expect(wrapper.vm.currentTrade).toBeNull();
    expect(wrapper.vm.previousTrade).toBeNull();
  });

  it('should handle invalid message format gracefully', async () => {
    const wrapper = mount(TestComponent);
    
    const invalidMessage = { someOtherField: 'value' };
    
    mockOnMessage(invalidMessage);
    await nextTick();
    
    expect(wrapper.vm.currentTrade).toBeNull();
    expect(wrapper.vm.previousTrade).toBeNull();
  });

  it('should compute trade status correctly for first trade', async () => {
    const wrapper = mount(TestComponent);
    
    const tradeMessage = {
      data: [{
        price: '50000',
        side: 'BUY',
        size: '10',
        symbol: 'BTCPFC',
        timestamp: '1640995200000',
        tradeId: 12345
      }]
    };
    
    mockOnMessage(tradeMessage);
    await nextTick();
    
    const status = wrapper.vm.latestTradeStatus;
    expect(status.status).toBe(StatusChangeEnum.Same);
    expect(status.price).toBe(50000);
    expect(status.side).toBe(OrderSide.BUY);
  });

  it('should compute trade status correctly for price increase', async () => {
    const wrapper = mount(TestComponent);
    
    // Send first trade
    const firstTrade = {
      data: [{
        price: '50000',
        side: 'BUY',
        size: '10',
        symbol: 'BTCPFC',
        timestamp: '1640995200000',
        tradeId: 12345
      }]
    };
    
    mockOnMessage(firstTrade);
    await nextTick();
    
    // Send second trade with higher price
    const secondTrade = {
      data: [{
        price: '50100',
        side: 'SELL',
        size: '10',
        symbol: 'BTCPFC',
        timestamp: '1640995260000',
        tradeId: 12346
      }]
    };
    
    mockOnMessage(secondTrade);
    await nextTick();
    
    const status = wrapper.vm.latestTradeStatus;
    expect(status.status).toBe(StatusChangeEnum.Up);
    expect(status.price).toBe(50100);
    expect(status.side).toBe(OrderSide.SELL);
  });

  it('should compute trade status correctly for price decrease', async () => {
    const wrapper = mount(TestComponent);
    
    // Send first trade
    const firstTrade = {
      data: [{
        price: '50100',
        side: 'BUY',
        size: '10',
        symbol: 'BTCPFC',
        timestamp: '1640995200000',
        tradeId: 12345
      }]
    };
    
    mockOnMessage(firstTrade);
    await nextTick();
    
    // Send second trade with lower price
    const secondTrade = {
      data: [{
        price: '50000',
        side: 'SELL',
        size: '10',
        symbol: 'BTCPFC',
        timestamp: '1640995260000',
        tradeId: 12346
      }]
    };
    
    mockOnMessage(secondTrade);
    await nextTick();
    
    const status = wrapper.vm.latestTradeStatus;
    expect(status.status).toBe(StatusChangeEnum.Down);
    expect(status.price).toBe(50000);
    expect(status.side).toBe(OrderSide.SELL);
  });

  it('should compute trade status correctly for same price', async () => {
    const wrapper = mount(TestComponent);
    
    // Send first trade
    const firstTrade = {
      data: [{
        price: '50000',
        side: 'BUY',
        size: '10',
        symbol: 'BTCPFC',
        timestamp: '1640995200000',
        tradeId: 12345
      }]
    };
    
    mockOnMessage(firstTrade);
    await nextTick();
    
    // Send second trade with same price
    const secondTrade = {
      data: [{
        price: '50000',
        side: 'SELL',
        size: '10',
        symbol: 'BTCPFC',
        timestamp: '1640995260000',
        tradeId: 12346
      }]
    };
    
    mockOnMessage(secondTrade);
    await nextTick();
    
    const status = wrapper.vm.latestTradeStatus;
    expect(status.status).toBe(StatusChangeEnum.Same);
    expect(status.price).toBe(50000);
    expect(status.side).toBe(OrderSide.SELL);
  });

  it('should handle default trade status when no trades exist', () => {
    const wrapper = mount(TestComponent);
    
    const status = wrapper.vm.latestTradeStatus;
    expect(status.status).toBe(StatusChangeEnum.Same);
    expect(status.price).toBe(0);
    expect(status.side).toBeUndefined();
  });

  it('should handle string timestamp conversion', async () => {
    const wrapper = mount(TestComponent);
    
    const tradeMessage = {
      data: [{
        price: '50000',
        side: 'BUY',
        size: '10',
        symbol: 'BTCPFC',
        timestamp: '1640995200000', // String timestamp
        tradeId: 12345
      }]
    };
    
    mockOnMessage(tradeMessage);
    await nextTick();
    
    expect(wrapper.vm.currentTrade.timestamp).toBe(1640995200000);
  });

  it('should handle numeric timestamp', async () => {
    const wrapper = mount(TestComponent);
    
    const tradeMessage = {
      data: [{
        price: '50000',
        side: 'BUY',
        size: '10',
        symbol: 'BTCPFC',
        timestamp: 1640995200000, // Numeric timestamp
        tradeId: 12345
      }]
    };
    
    mockOnMessage(tradeMessage);
    await nextTick();
    
    expect(wrapper.vm.currentTrade.timestamp).toBe(1640995200000);
  });

  it('should generate tradeId when not provided', async () => {
    const wrapper = mount(TestComponent);
    
    const tradeMessage = {
      data: [{
        price: '50000',
        side: 'BUY',
        size: '10',
        symbol: 'BTCPFC',
        timestamp: '1640995200000'
        // No tradeId provided
      }]
    };
    
    mockOnMessage(tradeMessage);
    await nextTick();
    
    expect(wrapper.vm.currentTrade.tradeId).toBeDefined();
    expect(typeof wrapper.vm.currentTrade.tradeId).toBe('number');
  });

  it('should handle SELL side correctly', async () => {
    const wrapper = mount(TestComponent);
    
    const tradeMessage = {
      data: [{
        price: '50000',
        side: 'SELL',
        size: '10',
        symbol: 'BTCPFC',
        timestamp: '1640995200000',
        tradeId: 12345
      }]
    };
    
    mockOnMessage(tradeMessage);
    await nextTick();
    
    expect(wrapper.vm.currentTrade.side).toBe(OrderSide.SELL);
  });

  it('should handle BUY side correctly', async () => {
    const wrapper = mount(TestComponent);
    
    const tradeMessage = {
      data: [{
        price: '50000',
        side: 'BUY',
        size: '10',
        symbol: 'BTCPFC',
        timestamp: '1640995200000',
        tradeId: 12345
      }]
    };
    
    mockOnMessage(tradeMessage);
    await nextTick();
    
    expect(wrapper.vm.currentTrade.side).toBe(OrderSide.BUY);
  });
});
