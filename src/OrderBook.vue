<script setup lang="ts">
import { reactive, watch, ref, computed } from 'vue'
import { useBTSESocket } from './core/composable/useBTSESocket'
import { OrderSide } from './core/enums/OrderSide'
import { 
  processFullOrderBook, 
  updateFullOrderBook,
  type OrderBookData, 
} from './core/services/orderBookServices'
import { OrderBookUpdateType } from './core/enums/OrderBookUpdateType'
import OrderBookRow from './components/UI/OrderBookRow.vue'

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

const currentTrade = ref<TradeData | null>(null)

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
      /** 買方 降序排序 */
      orderBook.bids = processedData.bids.sort((a, b) => b.price - a.price);
      /** 賣方 升序排序 */
      orderBook.asks = processedData.asks.sort((a, b) => a.price - b.price);
      // console.log('📈 初始訂單簿數據:', orderBook);
    } else {
      // 增量更新
      const updatedData = updateFullOrderBook(orderBook, { asks, bids });
      /** 買方 降序排序 */
      orderBook.bids = updatedData.asks.sort((a, b) => b.price - a.price);
      /** 賣方 升序排序 */
      orderBook.asks = updatedData.bids.sort((a, b) => a.price - b.price);

      // console.log('📈 訂單簿增量更新:', orderBook);
    }
  }
})

/**
 * Trade History
 */
const { connect: connectTradeHistory, disconnect: disconnectTradeHistory } = useBTSESocket({
  url: 'wss://ws.btse.com/ws/futures',
  topic: 'tradeHistoryApi:BTCPFC',
  onMessage: (data) => {
    currentTrade.value = data[0]
    console.log('📈 Trade History:', data)
    // tradeHistory.push(...data)
  }
})

const displayOrderBook = computed(() => {
  return {
    asks: orderBook.asks.slice(0, 8),
    bids: orderBook.bids.slice(0, 8)
  }
})

</script>

<template>
  <div class="order-book">
    <!-- Title -->
    <h1>Order Book</h1>
    <!-- Header -->
    <div class="order-book--header">
      <div>Price (USD)</div>
      <div>Size</div>
      <div>Total</div>
    </div>
    <!-- Asks 賣方 -->
    <div class="order-book--asks">
      <template v-for="ask in displayOrderBook.asks" :key="ask.price">
        <OrderBookRow :quote="ask" :side="OrderSide.SELL" />
      </template>
    </div>

    <!-- Current Trade -->
    <div class="order-book--current-trade">
      <div class="order-book--current-trade--price">
        {{ currentTrade?.price }}
      </div>
    </div>

    <!-- Bids 買方 -->
    <div class="order-book--bids">
      <template v-for="bid in displayOrderBook.bids" :key="bid.price">
        <OrderBookRow :quote="bid" :side="OrderSide.BUY" />
      </template>
    </div>

  </div>
</template>

<style scoped>

</style>
