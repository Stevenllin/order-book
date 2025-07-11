import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { OrderBookUpdateType } from '../enums/order/OrderBookUpdateType';

// Mock modules
vi.mock('./useBTSESocket', () => ({
  useBTSESocket: vi.fn()
}));

vi.mock('../services/orderBookServices', () => ({
  processFullOrderBook: vi.fn(),
  updateFullOrderBook: vi.fn()
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
import { processFullOrderBook, updateFullOrderBook } from '../services/orderBookServices';
import { useOrderBook } from './useOrderBook';

// 創建測試組件來使用 composable
const TestComponent = defineComponent({
  setup() {
    const orderBookComposable = useOrderBook();
    return orderBookComposable;
  },
  render() {
    return h('div', 'test');
  }
});

describe('useOrderBook', () => {
  let mockConnectOrderBook;
  let mockDisconnectOrderBook;
  let mockProcessFullOrderBook;
  let mockUpdateFullOrderBook;
  let mockOnMessage;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useBTSESocket
    mockConnectOrderBook = vi.fn();
    mockDisconnectOrderBook = vi.fn();
    mockOnMessage = vi.fn();
    
    useBTSESocket.mockImplementation(({ onMessage }) => {
      mockOnMessage = onMessage;
      return {
        connect: mockConnectOrderBook,
        disconnect: mockDisconnectOrderBook
      };
    });

    // Mock orderBookServices
    mockProcessFullOrderBook = vi.fn();
    mockUpdateFullOrderBook = vi.fn();
    
    processFullOrderBook.mockImplementation(mockProcessFullOrderBook);
    updateFullOrderBook.mockImplementation(mockUpdateFullOrderBook);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with loading state', () => {
    const wrapper = mount(TestComponent);
    
    expect(wrapper.vm.isLoading).toBe(true);
    expect(wrapper.vm.orderBook.asks).toEqual([]);
    expect(wrapper.vm.orderBook.bids).toEqual([]);
  });

  it('should connect to WebSocket when connectOrderBook is called', () => {
    const wrapper = mount(TestComponent);
    
    wrapper.vm.connectOrderBook();
    
    expect(mockConnectOrderBook).toHaveBeenCalled();
  });

  it('should disconnect from WebSocket when disconnectOrderBook is called', () => {
    const wrapper = mount(TestComponent);
    
    wrapper.vm.disconnectOrderBook();
    
    expect(mockDisconnectOrderBook).toHaveBeenCalled();
  });

  it('should process snapshot data correctly', () => {
    const wrapper = mount(TestComponent);
    
    // Mock processed data
    const mockProcessedData = {
      asks: [
        { price: 50000, size: 1, total: 1 },
        { price: 50001, size: 2, total: 3 }
      ],
      bids: [
        { price: 49999, size: 1, total: 1 },
        { price: 49998, size: 2, total: 3 }
      ]
    };
    
    mockProcessFullOrderBook.mockReturnValue(mockProcessedData);
    
    const snapshotData = {
      asks: [['50000', '1'], ['50001', '2']],
      bids: [['49999', '1'], ['49998', '2']],
      seqNum: 1,
      prevSeqNum: 0,
      type: OrderBookUpdateType.SNAPSHOT,
      timestamp: Date.now(),
      symbol: 'BTCPFC'
    };
    
    // Simulate receiving snapshot data via WebSocket
    mockOnMessage(snapshotData);
    
    expect(mockProcessFullOrderBook).toHaveBeenCalledWith({
      asks: snapshotData.asks,
      bids: snapshotData.bids
    });
    expect(wrapper.vm.isLoading).toBe(false);
    expect(wrapper.vm.orderBook.asks).toEqual(mockProcessedData.asks);
    expect(wrapper.vm.orderBook.bids).toEqual(mockProcessedData.bids);
  });

  it('should process incremental update data correctly', () => {
    const wrapper = mount(TestComponent);
    
    // Set initial state by sending snapshot first
    const initialData = {
      asks: [['50000', '1'], ['50001', '2']],
      bids: [['49999', '1'], ['49998', '2']],
      seqNum: 1,
      prevSeqNum: 0,
      type: OrderBookUpdateType.SNAPSHOT,
      timestamp: Date.now(),
      symbol: 'BTCPFC'
    };
    
    const mockInitialData = {
      asks: [
        { price: 50000, size: 1, total: 1 },
        { price: 50001, size: 2, total: 3 }
      ],
      bids: [
        { price: 49999, size: 1, total: 1 },
        { price: 49998, size: 2, total: 3 }
      ]
    };
    
    mockProcessFullOrderBook.mockReturnValue(mockInitialData);
    mockOnMessage(initialData);
    
    // Mock updated data
    const mockUpdatedData = {
      asks: [
        { price: 50000, size: 1, total: 1 },
        { price: 50001, size: 3, total: 4 },
        { price: 50002, size: 1, total: 1 }
      ],
      bids: [
        { price: 49999, size: 1, total: 1 },
        { price: 49998, size: 2, total: 3 },
        { price: 49997, size: 1, total: 1 }
      ]
    };
    
    mockUpdateFullOrderBook.mockReturnValue(mockUpdatedData);
    
    const updateData = {
      asks: [['50001', '3'], ['50002', '1']],
      bids: [['49997', '1']],
      seqNum: 2,
      prevSeqNum: 1,
      type: OrderBookUpdateType.UPDATE,
      timestamp: Date.now(),
      symbol: 'BTCPFC'
    };
    
    // Simulate receiving update data via WebSocket
    mockOnMessage(updateData);
    
    expect(mockUpdateFullOrderBook).toHaveBeenCalledWith(wrapper.vm.orderBook, {
      asks: updateData.asks,
      bids: updateData.bids
    });
    expect(wrapper.vm.orderBook.asks).toEqual(mockUpdatedData.asks);
    expect(wrapper.vm.orderBook.bids).toEqual(mockUpdatedData.bids);
  });

  it('should handle sequence number mismatch by reconnecting', async () => {
    const wrapper = mount(TestComponent);
    
    // Send initial snapshot to set previousOrder
    const initialData = {
      asks: [],
      bids: [],
      seqNum: 1,
      prevSeqNum: 0,
      type: OrderBookUpdateType.SNAPSHOT,
      timestamp: Date.now(),
      symbol: 'BTCPFC'
    };
    
    mockProcessFullOrderBook.mockReturnValue({ asks: [], bids: [] });
    mockOnMessage(initialData);
    
    // Wait for Vue to update
    await nextTick();
    
    // Clear mock calls from initial setup
    mockDisconnectOrderBook.mockClear();
    mockConnectOrderBook.mockClear();
    
    const updateData = {
      asks: [],
      bids: [],
      seqNum: 3, // Current sequence number
      prevSeqNum: 2, // Previous sequence number (should be 1, but we set it to 2 to create mismatch)
      type: OrderBookUpdateType.UPDATE,
      timestamp: Date.now(),
      symbol: 'BTCPFC'
    };
    
    // Mock updateFullOrderBook to return valid data (even though it shouldn't be called)
    mockUpdateFullOrderBook.mockReturnValue({ asks: [], bids: [] });
    
    // Simulate receiving data with sequence mismatch
    mockOnMessage(updateData);
    
    // Wait for Vue to update
    await nextTick();
    
    expect(mockDisconnectOrderBook).toHaveBeenCalled();
    expect(mockConnectOrderBook).toHaveBeenCalled();
  });

  it('should compute display order book correctly', () => {
    const wrapper = mount(TestComponent);
    
    // Set order book data by sending snapshot
    const snapshotData = {
      asks: [['50000', '1'], ['50001', '2'], ['50002', '1'], ['50003', '3'], 
             ['50004', '2'], ['50005', '1'], ['50006', '4'], ['50007', '2'], ['50008', '1']],
      bids: [['49999', '1'], ['49998', '2'], ['49997', '1'], ['49996', '3'], 
             ['49995', '2'], ['49994', '1'], ['49993', '4'], ['49992', '2'], ['49991', '1']],
      seqNum: 1,
      prevSeqNum: 0,
      type: OrderBookUpdateType.SNAPSHOT,
      timestamp: Date.now(),
      symbol: 'BTCPFC'
    };
    
    const mockProcessedData = {
      asks: [
        { price: 50000, size: 1, total: 1 },
        { price: 50001, size: 2, total: 3 },
        { price: 50002, size: 1, total: 4 },
        { price: 50003, size: 3, total: 7 },
        { price: 50004, size: 2, total: 9 },
        { price: 50005, size: 1, total: 10 },
        { price: 50006, size: 4, total: 14 },
        { price: 50007, size: 2, total: 16 },
        { price: 50008, size: 1, total: 17 }
      ],
      bids: [
        { price: 49999, size: 1, total: 1 },
        { price: 49998, size: 2, total: 3 },
        { price: 49997, size: 1, total: 4 },
        { price: 49996, size: 3, total: 7 },
        { price: 49995, size: 2, total: 9 },
        { price: 49994, size: 1, total: 10 },
        { price: 49993, size: 4, total: 14 },
        { price: 49992, size: 2, total: 16 },
        { price: 49991, size: 1, total: 17 }
      ]
    };
    
    mockProcessFullOrderBook.mockReturnValue(mockProcessedData);
    mockOnMessage(snapshotData);
    
    const displayOrderBook = wrapper.vm.displayOrderBook;
    
    // Should only show first 8 entries (maxOrderBookEntries)
    expect(displayOrderBook.asks).toHaveLength(8);
    expect(displayOrderBook.bids).toHaveLength(8);
    
    // Should calculate totals correctly (sum of all entries, not just displayed ones)
    expect(displayOrderBook.asksTotal).toBe(81); // Sum of all 9 entries: 1+3+4+7+9+10+14+16+17 = 81
    expect(displayOrderBook.bidsTotal).toBe(81); // Sum of all 9 entries: 1+3+4+7+9+10+14+16+17 = 81
    
    // Should exclude the 9th entry
    expect(displayOrderBook.asks.find(entry => entry.price === 50008)).toBeUndefined();
    expect(displayOrderBook.bids.find(entry => entry.price === 49991)).toBeUndefined();
  });

  it('should store previous displayed order book during updates', () => {
    const wrapper = mount(TestComponent);
    
    // Send initial snapshot
    const initialData = {
      asks: [['50000', '1'], ['50001', '2']],
      bids: [['49999', '1'], ['49998', '2']],
      seqNum: 1,
      prevSeqNum: 0,
      type: OrderBookUpdateType.SNAPSHOT,
      timestamp: Date.now(),
      symbol: 'BTCPFC'
    };
    
    const mockInitialData = {
      asks: [
        { price: 50000, size: 1, total: 1 },
        { price: 50001, size: 2, total: 3 }
      ],
      bids: [
        { price: 49999, size: 1, total: 1 },
        { price: 49998, size: 2, total: 3 }
      ]
    };
    
    mockProcessFullOrderBook.mockReturnValue(mockInitialData);
    mockOnMessage(initialData);
    
    // Mock updated data
    const mockUpdatedData = {
      asks: [
        { price: 50000, size: 1, total: 1 },
        { price: 50001, size: 3, total: 4 }
      ],
      bids: [
        { price: 49999, size: 1, total: 1 },
        { price: 49998, size: 2, total: 3 }
      ]
    };
    
    mockUpdateFullOrderBook.mockReturnValue(mockUpdatedData);
    
    const updateData = {
      asks: [['50001', '3']],
      bids: [],
      seqNum: 2,
      prevSeqNum: 1,
      type: OrderBookUpdateType.UPDATE,
      timestamp: Date.now(),
      symbol: 'BTCPFC'
    };
    
    // Simulate receiving update data
    mockOnMessage(updateData);
    
    // Should store previous displayed order book
    expect(wrapper.vm.previousDisplayedOrderBook.asks).toEqual([
      { price: 50000, size: 1, total: 1 },
      { price: 50001, size: 2, total: 3 }
    ]);
    expect(wrapper.vm.previousDisplayedOrderBook.bids).toEqual([
      { price: 49999, size: 1, total: 1 },
      { price: 49998, size: 2, total: 3 }
    ]);
  });

  it('should sort asks by ascending price and bids by descending price', () => {
    const wrapper = mount(TestComponent);
    
    // Mock processed data with unsorted prices
    const mockProcessedData = {
      asks: [
        { price: 50002, size: 1, total: 1 },
        { price: 50000, size: 2, total: 3 },
        { price: 50001, size: 1, total: 4 }
      ],
      bids: [
        { price: 49998, size: 1, total: 1 },
        { price: 49999, size: 2, total: 3 },
        { price: 49997, size: 1, total: 4 }
      ]
    };
    
    mockProcessFullOrderBook.mockReturnValue(mockProcessedData);
    
    const snapshotData = {
      asks: [['50002', '1'], ['50000', '2'], ['50001', '1']],
      bids: [['49998', '1'], ['49999', '2'], ['49997', '1']],
      seqNum: 1,
      prevSeqNum: 0,
      type: OrderBookUpdateType.SNAPSHOT,
      timestamp: Date.now(),
      symbol: 'BTCPFC'
    };
    
    // Simulate receiving snapshot data
    mockOnMessage(snapshotData);
    
    // Asks should be sorted by ascending price
    expect(wrapper.vm.orderBook.asks[0].price).toBe(50000);
    expect(wrapper.vm.orderBook.asks[1].price).toBe(50001);
    expect(wrapper.vm.orderBook.asks[2].price).toBe(50002);
    
    // Bids should be sorted by descending price
    expect(wrapper.vm.orderBook.bids[0].price).toBe(49999);
    expect(wrapper.vm.orderBook.bids[1].price).toBe(49998);
    expect(wrapper.vm.orderBook.bids[2].price).toBe(49997);
  });
});
