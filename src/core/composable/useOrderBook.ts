import { reactive, ref, computed } from 'vue'
import { useBTSESocket } from './useBTSESocket'
import { 
  processFullOrderBook, 
  updateFullOrderBook,
  type OrderBookData, 
} from '../services/orderBookServices'
import { OrderBookUpdateType } from '../enums/order/OrderBookUpdateType'
import type { OrderBookEntry } from '../services/orderBookServices'
import { config } from '../../config/env'
import type { OrderParsed } from '../../types'

export function useOrderBook() {
  // State
  const isLoading = ref(true)
  const orderBook = reactive<OrderBookData>({
    asks: [],
    bids: []
  })
  const previousOrder = ref<OrderParsed | null>(null)
  const previousDisplayedOrderBook = reactive<{
    asks: OrderBookEntry[]
    bids: OrderBookEntry[]
  }>({
    asks: [],
    bids: []
  })

  // Computed
const displayOrderBook = computed(() => {
    // 避免重複計算，先取得要顯示的訂單數據
    const displayAsks = orderBook.asks.slice(0, config.display.maxOrderBookEntries)
    const displayBids = orderBook.bids.slice(0, config.display.maxOrderBookEntries)

    // 計算總量
    const asksTotal = displayAsks.reduce((acc, curr) => acc + curr.total, 0)
    const bidsTotal = displayBids.reduce((acc, curr) => acc + curr.total, 0)

    return {
      asks: displayAsks,
      bids: displayBids,
      asksTotal,
      bidsTotal
    }
  })

  // Methods
  const handleOrderBookMessage = (data: OrderParsed) => {
    const { asks, bids, type } = data
    
    // Check sequence number mismatch
    if (previousOrder.value) {
      const { seqNum } = previousOrder.value
      const { prevSeqNum } = data

      if (prevSeqNum !== seqNum) {
        disconnectOrderBook()
        connectOrderBook()
        previousOrder.value = null
        return
      }
    }

    previousOrder.value = data
    
    if (type === OrderBookUpdateType.SNAPSHOT) {
      // Initial data processing
      const processedData = processFullOrderBook({ asks, bids })
      orderBook.bids = processedData.bids.sort((a, b) => b.price - a.price)
      orderBook.asks = processedData.asks.sort((a, b) => b.price - a.price)
      isLoading.value = false

    } else {
      // Incremental update
      previousDisplayedOrderBook.asks = [...orderBook.asks.slice(0, config.display.maxOrderBookEntries)]
      previousDisplayedOrderBook.bids = [...orderBook.bids.slice(0, config.display.maxOrderBookEntries)]
      
      const updatedData = updateFullOrderBook(orderBook, { asks, bids })
      orderBook.bids = updatedData.bids.sort((a, b) => b.price - a.price)
      orderBook.asks = updatedData.asks.sort((a, b) => b.price - a.price)
    }
  }

  // WebSocket connection
  const { connect: connectOrderBook, disconnect: disconnectOrderBook } = useBTSESocket({
    url: config.websocket.orderBook.url,
    topic: config.websocket.orderBook.topic,
    onMessage: handleOrderBookMessage
  })

  return {
    // State
    isLoading,
    orderBook,
    previousDisplayedOrderBook,
    
    // Computed
    displayOrderBook,
    
    // Methods
    connectOrderBook,
    disconnectOrderBook
  }
} 