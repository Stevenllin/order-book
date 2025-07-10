<script setup lang="ts">
import { reactive, watch, ref } from 'vue'
import { useBTSESocket } from './core/composable/useBTSESocket'
import { OrderSide } from './core/enums/OrderSide'
import { 
  processFullOrderBook, 
  updateFullOrderBook,
  type OrderBookData, 
} from './core/services/orderBookServices'
import { OrderBookUpdateType } from './core/enums/OrderBookUpdateType'

type TradeData = {
  price: number
  side: OrderSide
  size: number
  symbol: string
  timestamp: number
  tradeId: number
}

type QuoteTuple = [string, string]

interface OrderParsed {
  asks: QuoteTuple[]
  bids: QuoteTuple[]
  seqNum: number
  prevSeqNum: number
  type: OrderBookUpdateType
  timestamp: number
  symbol: string
}

const tradeHistory = reactive<TradeData[]>([])
const orderBook = reactive<OrderBookData>({
  asks: [],
  bids: []
})
const previousOrder = ref<OrderParsed | null>(null)

/**
 * Order Book Update
 */
const { connect: connectOrderBook, disconnect: disconnectOrderBook } = useBTSESocket({
  url: 'wss://ws.btse.com/ws/oss/futures',
  topic: 'update:BTCPFC_0',
  onMessage: (data) => {
    const { asks, bids, type } = data;
    /** 檢查是否為訂單簿更新 */
    if (previousOrder.value) {
      const { seqNum } = previousOrder.value;
      const { prevSeqNum } = data;

      /** 如果 seqNum 不相等，則斷開訂單簿連接，並重新連接 */
      if (prevSeqNum !== seqNum) {
        disconnectOrderBook();
        connectOrderBook();
        previousOrder.value = null;
      }
    }

    previousOrder.value = data
    
    // 檢查是否為初始數據 Snapshot
    if (type === OrderBookUpdateType.SNAPSHOT) {
      // 初始數據，使用完整處理
      const processedData = processFullOrderBook({ asks, bids });
      orderBook.asks = processedData.asks;
      orderBook.bids = processedData.bids;
      // console.log('📈 初始訂單簿數據:', orderBook);
    } else {
      // 增量更新
      const updatedData = updateFullOrderBook(orderBook, { asks, bids });
      orderBook.asks = updatedData.asks;
      orderBook.bids = updatedData.bids;
      // console.log('📈 訂單簿增量更新:', orderBook);
    }
    
    // 顯示前5筆數據作為示例
    // console.log('前5筆 asks:', orderBook.asks.slice(0, 5).map(entry => ({
    //   price: formatPrice(entry.price),
    //   size: formatSize(entry.size),
    //   total: formatTotal(entry.total)
    // })));
  }
})

/**
 * Trade History
 */
const { connect: connectTradeHistory, disconnect: disconnectTradeHistory } = useBTSESocket({
  url: 'wss://ws.btse.com/ws/futures',
  topic: 'tradeHistoryApi:BTCPFC',
  onMessage: (data) => {
    // console.log('📈 Trade History:', data)
    // tradeHistory.push(...data)
  }
})

</script>

<template>
  <div>
    <h1>BTSE 訂單簿</h1>
  </div>
</template>

<style scoped>

</style>
