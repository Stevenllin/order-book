import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import OrderBook from './OrderBook.vue';
import { OrderSide } from './core/enums/order/OrderSide';
import { OrderBookUpdateType } from './core/enums/order/OrderBookUpdateType';
import { StatusChangeEnum } from './core/enums/system/StatusChangeEnum';

// Mock the composable to capture onMessage callbacks
vi.mock('./core/composable/useBTSESocket.ts', () => ({
  useBTSESocket: vi.fn()
}));

// Import the mocked composable
import { useBTSESocket } from './core/composable/useBTSESocket.ts';

// Mock components
vi.mock('./components/UI/OrderBookRow.vue', () => ({
  default: {
    name: 'OrderBookRow',
    props: ['quote', 'side', 'previousOrderBook', 'latestTradeStatus', 'total'],
    template: '<div class="order-book-row">{{ quote.price }}</div>'
  }
}));

vi.mock('./components/UI/Loading.vue', () => ({
  default: {
    name: 'Loading',
    props: ['text', 'size'],
    template: '<div class="loading">{{ text }}</div>'
  }
}));

describe('OrderBook', () => {
  let orderBookOnMessage;
  let tradeHistoryOnMessage;
  let mockConnectOrderBook;
  let mockDisconnectOrderBook;

  beforeEach(() => {
    // 重置 mock
    vi.clearAllMocks();
    
    // 設置 useBTSESocket mock
    mockConnectOrderBook = vi.fn();
    mockDisconnectOrderBook = vi.fn();
    
    useBTSESocket.mockImplementation((options) => {
      if (options.topic === 'update:BTCPFC') {
        orderBookOnMessage = options.onMessage;
        return {
          connect: mockConnectOrderBook,
          disconnect: mockDisconnectOrderBook
        };
      } else if (options.topic === 'tradeHistoryApi:BTCPFC') {
        tradeHistoryOnMessage = options.onMessage;
        return {
          connect: vi.fn(),
          disconnect: vi.fn()
        };
      }
    });
  });

  it('should show loading state initially', () => {
    const wrapper = mount(OrderBook);
    
    expect(wrapper.find('.loading').exists()).toBe(true);
    expect(wrapper.find('.loading').text()).toContain('Loading Order Book');
  });

  it('should hide loading and show content after receiving snapshot', async () => {
    const wrapper = mount(OrderBook);
    
    // 確保回調函數已經設置
    expect(orderBookOnMessage).toBeDefined();
    expect(tradeHistoryOnMessage).toBeDefined();
        
    // 模擬接收 snapshot 數據
    const snapshotData = {
      asks: [['100', '10'], ['101', '5']],
      bids: [['99', '8'], ['98', '12']],
      type: OrderBookUpdateType.SNAPSHOT,
      seqNum: 1,
      prevSeqNum: 0
    };
    
    // 模擬接收交易歷史數據
    const tradeData = [
      {
        price: 100,
        side: OrderSide.BUY,
        size: 10,
        symbol: 'BTCPFC',
        timestamp: Date.now(),
        tradeId: 1
      }
    ];
    
    // 使用保存的回調函數
    orderBookOnMessage(snapshotData);
    tradeHistoryOnMessage(tradeData);
    await wrapper.vm.$nextTick();
        
    expect(wrapper.find('.loading').exists()).toBe(false);
    expect(wrapper.find('h1').text()).toBe('Order Book');
  });

  it('should display order book data correctly', async () => {
    const wrapper = mount(OrderBook);
    
    // 確保回調函數已經設置
    expect(orderBookOnMessage).toBeDefined();
    expect(tradeHistoryOnMessage).toBeDefined();
    
    // 模擬接收 snapshot 數據
    const snapshotData = {
      asks: [['100', '10'], ['101', '5']],
      bids: [['99', '8'], ['98', '12']],
      type: OrderBookUpdateType.SNAPSHOT,
      seqNum: 1,
      prevSeqNum: 0
    };
    
    // 模擬接收交易歷史數據
    const tradeData = [
      {
        price: 100,
        side: OrderSide.BUY,
        size: 10,
        symbol: 'BTCPFC',
        timestamp: Date.now(),
        tradeId: 1
      }
    ];
    
    orderBookOnMessage(snapshotData);
    tradeHistoryOnMessage(tradeData);
    await wrapper.vm.$nextTick();
    
    // 檢查 asks 和 bids 的數量
    const askRows = wrapper.findAll('.order-book-row');
    expect(askRows.length).toBeGreaterThan(0);
  });

  it('should handle incremental updates correctly', async () => {
    const wrapper = mount(OrderBook);
    
    // 確保回調函數已經設置
    expect(orderBookOnMessage).toBeDefined();
    expect(tradeHistoryOnMessage).toBeDefined();
    
    // 先接收 snapshot
    const snapshotData = {
      asks: [['100', '10']],
      bids: [['99', '8']],
      type: OrderBookUpdateType.SNAPSHOT,
      seqNum: 1,
      prevSeqNum: 0
    };
    
    // 模擬接收交易歷史數據
    const tradeData = [
      {
        price: 100,
        side: OrderSide.BUY,
        size: 10,
        symbol: 'BTCPFC',
        timestamp: Date.now(),
        tradeId: 1
      }
    ];
    
    orderBookOnMessage(snapshotData);
    tradeHistoryOnMessage(tradeData);
    await wrapper.vm.$nextTick();
    
    // 接收增量更新
    const updateData = {
      asks: [['100', '15'], ['102', '5']],
      bids: [['99', '12']],
      type: OrderBookUpdateType.UPDATE,
      seqNum: 2,
      prevSeqNum: 1
    };
    
    orderBookOnMessage(updateData);
    await wrapper.vm.$nextTick();
    
    // 檢查是否正確處理了更新
    expect(wrapper.vm.orderBook.asks.length).toBeGreaterThan(0);
    expect(wrapper.vm.orderBook.bids.length).toBeGreaterThan(0);
  });

  it('should reconnect when sequence number mismatch', async () => {
    const wrapper = mount(OrderBook);
    
    // 確保回調函數已經設置
    expect(orderBookOnMessage).toBeDefined();
    expect(tradeHistoryOnMessage).toBeDefined();
    
    // 先接收第一個消息
    const firstData = {
      asks: [['100', '10']],
      bids: [['99', '8']],
      type: OrderBookUpdateType.SNAPSHOT,
      seqNum: 1,
      prevSeqNum: 0
    };
    
    // 模擬接收交易歷史數據
    const tradeData = [
      {
        price: 100,
        side: OrderSide.BUY,
        size: 10,
        symbol: 'BTCPFC',
        timestamp: Date.now(),
        tradeId: 1
      }
    ];
    
    orderBookOnMessage(firstData);
    tradeHistoryOnMessage(tradeData);
    await wrapper.vm.$nextTick();
    
    // 接收序列號不匹配的消息
    const mismatchData = {
      asks: [['100', '15']],
      bids: [['99', '12']],
      type: OrderBookUpdateType.UPDATE,
      seqNum: 3,
      prevSeqNum: 2  // 不匹配前一個 seqNum (1)
    };
    
    orderBookOnMessage(mismatchData);
    await wrapper.vm.$nextTick();
    
    // 應該調用斷開和重新連接
    expect(mockDisconnectOrderBook).toHaveBeenCalled();
    expect(mockConnectOrderBook).toHaveBeenCalled();
  });

  it('should handle trade history updates', async () => {
    const wrapper = mount(OrderBook);
    
    // 確保回調函數已經設置
    expect(orderBookOnMessage).toBeDefined();
    expect(tradeHistoryOnMessage).toBeDefined();
    
    // 模擬接收訂單簿數據
    const snapshotData = {
      asks: [['100', '10']],
      bids: [['99', '8']],
      type: OrderBookUpdateType.SNAPSHOT,
      seqNum: 1,
      prevSeqNum: 0
    };
    
    // 模擬接收交易歷史數據 - 需要超過2個元素
    const tradeData = [
      {
        price: 100,
        side: OrderSide.BUY,
        size: 10,
        symbol: 'BTCPFC',
        timestamp: Date.now(),
        tradeId: 1
      },
      {
        price: 101,
        side: OrderSide.SELL,
        size: 5,
        symbol: 'BTCPFC',
        timestamp: Date.now(),
        tradeId: 2
      },
      {
        price: 102,
        side: OrderSide.BUY,
        size: 3,
        symbol: 'BTCPFC',
        timestamp: Date.now(),
        tradeId: 3
      }
    ];
    
    orderBookOnMessage(snapshotData);
    tradeHistoryOnMessage(tradeData);
    await wrapper.vm.$nextTick();
    
    expect(wrapper.vm.currentTrade).toEqual(tradeData[1]);
    expect(wrapper.vm.previousTrade).toEqual(tradeData[0]);
  });

  it('should calculate trade status correctly', async () => {
    const wrapper = mount(OrderBook);
    
    // 確保回調函數已經設置
    expect(orderBookOnMessage).toBeDefined();
    expect(tradeHistoryOnMessage).toBeDefined();
    
    // 模擬接收訂單簿數據
    const snapshotData = {
      asks: [['100', '10']],
      bids: [['99', '8']],
      type: OrderBookUpdateType.SNAPSHOT,
      seqNum: 1,
      prevSeqNum: 0
    };
    
    // 模擬價格上漲 - 需要超過2個元素
    const tradeData = [
      { price: 100, side: OrderSide.BUY, size: 10, symbol: 'BTCPFC', timestamp: Date.now(), tradeId: 1 },
      { price: 101, side: OrderSide.SELL, size: 5, symbol: 'BTCPFC', timestamp: Date.now(), tradeId: 2 },
      { price: 102, side: OrderSide.BUY, size: 3, symbol: 'BTCPFC', timestamp: Date.now(), tradeId: 3 }
    ];
    
    orderBookOnMessage(snapshotData);
    tradeHistoryOnMessage(tradeData);
    await wrapper.vm.$nextTick();
    
    expect(wrapper.vm.latestTradeStatus.status).toBe(StatusChangeEnum.Up);
    expect(wrapper.vm.latestTradeStatus.price).toBe(101);
    expect(wrapper.vm.latestTradeStatus.side).toBe(OrderSide.SELL);
  });

  it('should calculate display order book totals correctly', async () => {
    const wrapper = mount(OrderBook);
    
    // 確保回調函數已經設置
    expect(orderBookOnMessage).toBeDefined();
    expect(tradeHistoryOnMessage).toBeDefined();
    
    const snapshotData = {
      asks: [['100', '10'], ['101', '5']],
      bids: [['99', '8'], ['98', '12']],
      type: OrderBookUpdateType.SNAPSHOT,
      seqNum: 1,
      prevSeqNum: 0
    };
    
    // 模擬接收交易歷史數據
    const tradeData = [
      {
        price: 100,
        side: OrderSide.BUY,
        size: 10,
        symbol: 'BTCPFC',
        timestamp: Date.now(),
        tradeId: 1
      }
    ];
    
    orderBookOnMessage(snapshotData);
    tradeHistoryOnMessage(tradeData);
    await wrapper.vm.$nextTick();
    
    const displayData = wrapper.vm.displayOrderBook;
    expect(displayData.asksTotal).toBeGreaterThan(0);
    expect(displayData.bidsTotal).toBeGreaterThan(0);
  });

  it('should limit displayed orders to 8 entries', async () => {
    const wrapper = mount(OrderBook);
    
    // 確保回調函數已經設置
    expect(orderBookOnMessage).toBeDefined();
    expect(tradeHistoryOnMessage).toBeDefined();
    
    // 創建超過 8 個條目的數據
    const asks = Array.from({ length: 10 }, (_, i) => [`${100 + i}`, '10']);
    const bids = Array.from({ length: 10 }, (_, i) => [`${99 - i}`, '10']);
    
    const snapshotData = {
      asks,
      bids,
      type: OrderBookUpdateType.SNAPSHOT,
      seqNum: 1,
      prevSeqNum: 0
    };
    
    // 模擬接收交易歷史數據
    const tradeData = [
      {
        price: 100,
        side: OrderSide.BUY,
        size: 10,
        symbol: 'BTCPFC',
        timestamp: Date.now(),
        tradeId: 1
      }
    ];
    
    orderBookOnMessage(snapshotData);
    tradeHistoryOnMessage(tradeData);
    await wrapper.vm.$nextTick();
    
    const displayData = wrapper.vm.displayOrderBook;
    expect(displayData.asks.length).toBeLessThanOrEqual(8);
    expect(displayData.bids.length).toBeLessThanOrEqual(8);
  });
});
