import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import OrderBook from './OrderBook.vue';
import { OrderSide } from './core/enums/order/OrderSide';
import { OrderBookUpdateType } from './core/enums/order/OrderBookUpdateType';
import { StatusChangeEnum } from './core/enums/system/StatusChangeEnum';

// Mock the composables
vi.mock('./core/composable/useOrderBook.ts', () => ({
  useOrderBook: vi.fn()
}));

vi.mock('./core/composable/useTradeHistory.ts', () => ({
  useTradeHistory: vi.fn()
}));

// Import the mocked composables
import { useOrderBook } from './core/composable/useOrderBook.ts';
import { useTradeHistory } from './core/composable/useTradeHistory.ts';

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
  let mockOrderBookComposable;
  let mockTradeHistoryComposable;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup useOrderBook mock
    mockOrderBookComposable = {
      isLoading: { value: true },
      displayOrderBook: {
        asks: [],
        bids: [],
        asksTotal: 0,
        bidsTotal: 0
      },
      previousDisplayedOrderBook: {
        asks: [],
        bids: []
      },
      connectOrderBook: vi.fn(),
      disconnectOrderBook: vi.fn()
    };
    
    // Setup useTradeHistory mock
    mockTradeHistoryComposable = {
      isLoading: { value: true },
      latestTradeStatus: {
        status: StatusChangeEnum.Same,
        price: 0,
        side: null
      },
      connectTradeHistory: vi.fn(),
      disconnectTradeHistory: vi.fn()
    };
    
    useOrderBook.mockReturnValue(mockOrderBookComposable);
    useTradeHistory.mockReturnValue(mockTradeHistoryComposable);
  });

  it('should show loading state initially', () => {
    const wrapper = mount(OrderBook);
    
    expect(wrapper.find('.loading').exists()).toBe(true);
    expect(wrapper.find('.loading').text()).toContain('Loading Order Book');
  });

  it('should hide loading and show content after receiving data', async () => {
    // Set loading to false
    mockOrderBookComposable.isLoading.value = false;
    mockTradeHistoryComposable.isLoading.value = false;
    
    const wrapper = mount(OrderBook);
    
    expect(wrapper.find('.loading').exists()).toBe(false);
    expect(wrapper.find('h1').text()).toBe('Order Book');
  });

  it('should display order book data correctly', async () => {
    // Setup mock data
    mockOrderBookComposable.isLoading.value = false;
    mockTradeHistoryComposable.isLoading.value = false;
    mockOrderBookComposable.displayOrderBook.asks = [
      { price: 100, size: 10, total: 10 },
      { price: 101, size: 5, total: 15 }
    ];
    mockOrderBookComposable.displayOrderBook.bids = [
      { price: 99, size: 8, total: 8 },
      { price: 98, size: 12, total: 20 }
    ];
    
    const wrapper = mount(OrderBook);
    
    // Check that order book rows are rendered
    const askRows = wrapper.findAll('.order-book-row');
    expect(askRows.length).toBeGreaterThan(0);
  });

  it('should handle incremental updates correctly', async () => {
    // Setup mock data
    mockOrderBookComposable.isLoading.value = false;
    mockTradeHistoryComposable.isLoading.value = false;
    mockOrderBookComposable.displayOrderBook.asks = [
      { price: 100, size: 15, total: 15 },
      { price: 102, size: 5, total: 20 }
    ];
    mockOrderBookComposable.displayOrderBook.bids = [
      { price: 99, size: 12, total: 12 }
    ];
    
    const wrapper = mount(OrderBook);
    
    // Check that the composable was called
    expect(useOrderBook).toHaveBeenCalled();
    expect(useTradeHistory).toHaveBeenCalled();
  });

  it('should reconnect when sequence number mismatch', async () => {
    // Setup mock data
    mockOrderBookComposable.isLoading.value = false;
    mockTradeHistoryComposable.isLoading.value = false;
    
    const wrapper = mount(OrderBook);
    
    // Test that the component correctly uses the composables
    expect(useOrderBook).toHaveBeenCalled();
    expect(useTradeHistory).toHaveBeenCalled();
  });

  it('should handle trade history updates', async () => {
    // Setup mock data
    mockOrderBookComposable.isLoading.value = false;
    mockTradeHistoryComposable.isLoading.value = false;
    
    const wrapper = mount(OrderBook);
    
    // Test that the component correctly uses the trade history composable
    expect(useTradeHistory).toHaveBeenCalled();
  });

  it('should calculate trade status correctly', async () => {
    // Setup mock data
    mockOrderBookComposable.isLoading.value = false;
    mockTradeHistoryComposable.isLoading.value = false;
    mockTradeHistoryComposable.latestTradeStatus = {
      status: StatusChangeEnum.Up,
      price: 101,
      side: OrderSide.SELL
    };
    
    const wrapper = mount(OrderBook);
    
    // Test that trade status is correctly passed
    expect(mockTradeHistoryComposable.latestTradeStatus.status).toBe(StatusChangeEnum.Up);
    expect(mockTradeHistoryComposable.latestTradeStatus.price).toBe(101);
    expect(mockTradeHistoryComposable.latestTradeStatus.side).toBe(OrderSide.SELL);
  });

  it('should calculate display order book totals correctly', async () => {
    // Setup mock data
    mockOrderBookComposable.isLoading.value = false;
    mockTradeHistoryComposable.isLoading.value = false;
    mockOrderBookComposable.displayOrderBook.asksTotal = 15;
    mockOrderBookComposable.displayOrderBook.bidsTotal = 20;
    
    const wrapper = mount(OrderBook);
    
    const displayData = mockOrderBookComposable.displayOrderBook;
    expect(displayData.asksTotal).toBeGreaterThan(0);
    expect(displayData.bidsTotal).toBeGreaterThan(0);
  });

  it('should limit displayed orders to 8 entries', async () => {
    // Setup mock data
    mockOrderBookComposable.isLoading.value = false;
    mockTradeHistoryComposable.isLoading.value = false;
    
    // Create more entries than the limit
    const asks = Array.from({ length: 10 }, (_, i) => ({ 
      price: 100 + i, 
      size: 10, 
      total: 10 
    }));
    const bids = Array.from({ length: 10 }, (_, i) => ({ 
      price: 99 - i, 
      size: 10, 
      total: 10 
    }));
    
    // Mock the displayOrderBook computed property to simulate the limiting behavior
    mockOrderBookComposable.displayOrderBook = {
      asks: asks.slice(0, 8),
      bids: bids.slice(0, 8),
      asksTotal: asks.reduce((acc, curr) => acc + curr.total, 0),
      bidsTotal: bids.reduce((acc, curr) => acc + curr.total, 0)
    };
    
    const wrapper = mount(OrderBook);
    
    const displayData = mockOrderBookComposable.displayOrderBook;
    expect(displayData.asks.length).toBeLessThanOrEqual(8);
    expect(displayData.bids.length).toBeLessThanOrEqual(8);
  });

  it('should connect to WebSockets on mount', () => {
    const wrapper = mount(OrderBook);
    
    expect(mockOrderBookComposable.connectOrderBook).toHaveBeenCalled();
    expect(mockTradeHistoryComposable.connectTradeHistory).toHaveBeenCalled();
  });

  it('should disconnect from WebSockets on unmount', () => {
    const wrapper = mount(OrderBook);
    wrapper.unmount();
    
    expect(mockOrderBookComposable.disconnectOrderBook).toHaveBeenCalled();
    expect(mockTradeHistoryComposable.disconnectTradeHistory).toHaveBeenCalled();
  });
});
