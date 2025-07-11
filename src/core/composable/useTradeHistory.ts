import { ref, computed } from 'vue'
import { useBTSESocket } from './useBTSESocket'
import { OrderSide } from '../enums/order/OrderSide'
import { StatusChangeEnum } from '../enums/system/StatusChangeEnum'
import { config } from '../../config/env'
import type { TradeData, TradeStatus } from '../../types'

export function useTradeHistory() {
  // State
  const isLoading = ref(true)
  const currentTrade = ref<TradeData | null>(null)
  const previousTrade = ref<TradeData | null>(null)

  // Computed
  const latestTradeStatus = computed<TradeStatus>(() => {
    // If we have no current trade, return default values
    if (!currentTrade.value) {
      return {
        status: StatusChangeEnum.Same,
        price: 0,
        side: undefined
      }
    }

    const { price: currentPrice, side } = currentTrade.value

    // If we have no previous trade, this is the first trade
    if (!previousTrade.value) {
      return {
        status: StatusChangeEnum.Same,
        price: currentPrice,
        side
      }
    }

    // Compare with previous trade
    const { price: previousPrice } = previousTrade.value

    return {
      status: currentPrice > previousPrice ? StatusChangeEnum.Up :
             currentPrice < previousPrice ? StatusChangeEnum.Down :
             StatusChangeEnum.Same,
      price: currentPrice,
      side
    }
  })

  // Methods
  const handleTradeHistoryMessage = (message: any) => {
    
    // Handle different message formats
    let data: any[] = []
    if (message.data && Array.isArray(message.data)) {
      data = message.data
    } else if (Array.isArray(message)) {
      data = message
    } else {
      return
    }
    
    // Transform the data to match TradeData format
    const transformedData: TradeData[] = data.map(trade => ({
      price: parseFloat(trade.price),
      side: trade.side === 'BUY' ? OrderSide.BUY : OrderSide.SELL,
      size: parseFloat(trade.size),
      symbol: trade.symbol || 'BTCPFC',
      timestamp: typeof trade.timestamp === 'string' ? parseInt(trade.timestamp) : trade.timestamp,
      tradeId: trade.tradeId || Date.now()
    }))

    if (transformedData.length === 0) {
      return
    }

    // For the first trade, set it as current trade
    if (!currentTrade.value) {
      currentTrade.value = transformedData[0]
    } else if (transformedData.length === 1) {
      // For subsequent single trades, move current to previous and set new current
      previousTrade.value = currentTrade.value
      currentTrade.value = transformedData[0]
    } else if (transformedData.length > 1) {
      // For multiple trades, use the first two
      previousTrade.value = transformedData[0]
      currentTrade.value = transformedData[1]
    }
    
    isLoading.value = false
  }

  // WebSocket connection
  const { connect: connectTradeHistory, disconnect: disconnectTradeHistory } = useBTSESocket({
    url: config.websocket.tradeHistory.url,
    topic: config.websocket.tradeHistory.topic,
    onMessage: handleTradeHistoryMessage
  })

  return {
    // State
    isLoading,
    currentTrade,
    previousTrade,
    
    // Computed
    latestTradeStatus,
    
    // Methods
    connectTradeHistory,
    disconnectTradeHistory
  }
} 