import { ref, computed } from 'vue'
import { useBTSESocket } from './useBTSESocket'
import { OrderSide } from '../enums/order/OrderSide'
import { StatusChangeEnum } from '../enums/system/StatusChangeEnum'
import { config } from '../../config/env'
import type { TradeData, TradeStatus } from '../../types'

export function useTradeHistory() {
  // State
  const isLoading = ref(true)                          // 交易歷史載入狀態
  const currentTrade = ref<TradeData | null>(null)     // 當前交易資料
  const previousTrade = ref<TradeData | null>(null)    // 上一筆交易資料

  // Computed
  const latestTradeStatus = computed<TradeStatus>(() => {
    // 如果沒有當前交易，返回預設值
    if (!currentTrade.value) {
      return {
        status: StatusChangeEnum.Same,
        price: 0,
        side: undefined
      }
    }

    const { price: currentPrice, side } = currentTrade.value

    // 如果沒有上一筆交易，這是第一筆交易
    if (!previousTrade.value) {
      return {
        status: StatusChangeEnum.Same,
        price: currentPrice,
        side
      }
    }

    // 與上一筆交易比較價格變化
    const { price: previousPrice } = previousTrade.value

    return {
      status: currentPrice > previousPrice ? StatusChangeEnum.Up :    // 價格上漲
             currentPrice < previousPrice ? StatusChangeEnum.Down :   // 價格下跌
             StatusChangeEnum.Same,                                   // 價格不變
      price: currentPrice,
      side
    }
  })

  // Methods
  /**
   * 處理交易歷史 WebSocket 訊息
   * @param message WebSocket 接收到的訊息
   */
  const handleTradeHistoryMessage = (message: any) => {
    
    // 處理不同的訊息格式
    let data: any[] = []
    if (message.data && Array.isArray(message.data)) {
      data = message.data
    } else if (Array.isArray(message)) {
      data = message
    } else {
      return
    }
    
    // 將資料轉換為 TradeData 格式
    const transformedData: TradeData[] = data.map(trade => ({
      price: parseFloat(trade.price),                                              // 交易價格
      side: trade.side === 'BUY' ? OrderSide.BUY : OrderSide.SELL,                // 交易方向
      size: parseFloat(trade.size),                                               // 交易數量
      symbol: trade.symbol || 'BTCPFC',                                           // 交易對符號
      timestamp: typeof trade.timestamp === 'string' ? parseInt(trade.timestamp) : trade.timestamp,  // 交易時間戳
      tradeId: trade.tradeId || Date.now()                                        // 交易 ID
    }))

    if (transformedData.length === 0) {
      return
    }

    // 處理第一筆交易
    if (!currentTrade.value) {
      currentTrade.value = transformedData[0]
    } else if (transformedData.length === 1) {
      // 處理單筆交易更新：將當前交易移至上一筆，新交易設為當前交易
      previousTrade.value = currentTrade.value
      currentTrade.value = transformedData[0]
    } else if (transformedData.length > 1) {
      // 處理多筆交易更新：使用前兩筆交易資料
      previousTrade.value = transformedData[0]
      currentTrade.value = transformedData[1]
    }
    
    isLoading.value = false
  }

  // WebSocket 連接設定
  const { connect: connectTradeHistory, disconnect: disconnectTradeHistory } = useBTSESocket({
    url: config.websocket.tradeHistory.url,        // WebSocket 連接 URL
    topic: config.websocket.tradeHistory.topic,    // WebSocket 訂閱主題
    onMessage: handleTradeHistoryMessage           // WebSocket 訊息處理函數
  })

  return {
    // State
    isLoading,                  // 交易歷史載入狀態
    currentTrade,               // 當前交易資料
    previousTrade,              // 上一筆交易資料
    
    // Computed
    latestTradeStatus,          // 最新交易狀態
    
    // Methods
    connectTradeHistory,        // 連接交易歷史 WebSocket
    disconnectTradeHistory      // 斷開交易歷史 WebSocket 連接
  }
} 