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
  const isLoading = ref(true) // 訂單簿載入狀態
  const orderBook = reactive<OrderBookData>({
    asks: [], // 賣單列表
    bids: []  // 買單列表
  })
  const previousOrder = ref<OrderParsed | null>(null) // 上一筆訂單資料，用於檢查序號連續性
  const previousDisplayedOrderBook = reactive<{
    asks: OrderBookEntry[]
    bids: OrderBookEntry[]
  }>({
    asks: [], // 上一次顯示的賣單列表，用於比較變化
    bids: []  // 上一次顯示的買單列表，用於比較變化
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
      asks: displayAsks,   // 要顯示的賣單列表
      bids: displayBids,   // 要顯示的買單列表
      asksTotal,          // 賣單總量
      bidsTotal          // 買單總量
    }
  })

  // Methods
  /**
   * 處理訂單簿 WebSocket 訊息
   * @param data 訂單簿更新資料
   */
  const handleOrderBookMessage = (data: OrderParsed) => {
    const { asks, bids, type } = data
    
    // 檢查序號是否連續，如果不連續則重新連接
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
      // 處理完整訂單簿快照
      const processedData = processFullOrderBook({ asks, bids })
      orderBook.bids = processedData.bids.sort((a, b) => b.price - a.price) // 買單價格由高到低排序
      orderBook.asks = processedData.asks.sort((a, b) => b.price - a.price) // 賣單價格由高到低排序
      isLoading.value = false

    } else {
      // 處理增量更新
      // 保存上一次顯示的訂單簿狀態，用於比較變化
      previousDisplayedOrderBook.asks = [...orderBook.asks.slice(0, config.display.maxOrderBookEntries)]
      previousDisplayedOrderBook.bids = [...orderBook.bids.slice(0, config.display.maxOrderBookEntries)]
      
      const updatedData = updateFullOrderBook(orderBook, { asks, bids })
      orderBook.bids = updatedData.bids.sort((a, b) => b.price - a.price) // 買單價格由高到低排序
      orderBook.asks = updatedData.asks.sort((a, b) => b.price - a.price) // 賣單價格由高到低排序
    }
  }

  // WebSocket 連接設定
  const { connect: connectOrderBook, disconnect: disconnectOrderBook } = useBTSESocket({
    url: config.websocket.orderBook.url,
    topic: config.websocket.orderBook.topic,
    onMessage: handleOrderBookMessage
  })

  return {
    // State
    isLoading,                  // 訂單簿載入狀態
    orderBook,                  // 完整訂單簿資料
    previousDisplayedOrderBook, // 上一次顯示的訂單簿狀態
    
    // Computed
    displayOrderBook,           // 要顯示的訂單簿資料
    
    // Methods
    connectOrderBook,           // 連接訂單簿 WebSocket
    disconnectOrderBook        // 斷開訂單簿 WebSocket 連接
  }
} 