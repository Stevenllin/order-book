// Environment configuration
export const config = {
  websocket: {
    orderBook: {
      url: import.meta.env.VITE_ORDER_BOOK_WS_URL || 'wss://ws.btse.com/ws/oss/futures',
      topic: import.meta.env.VITE_ORDER_BOOK_TOPIC || 'update:BTCPFC'
    },
    tradeHistory: {
      url: import.meta.env.VITE_TRADE_HISTORY_WS_URL || 'wss://ws.btse.com/ws/futures',
      topic: import.meta.env.VITE_TRADE_HISTORY_TOPIC || 'tradeHistoryApi:BTCPFC'
    }
  },
  display: {
    maxOrderBookEntries: 8
  }
} as const 