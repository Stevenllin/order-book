<script setup lang="ts">
import { reactive, watch, ref, computed } from 'vue'
import { useBTSESocket } from './core/composable/useBTSESocket'
import { OrderSide } from './core/enums/order/OrderSide'
import { 
  processFullOrderBook, 
  updateFullOrderBook,
  type OrderBookData, 
} from './core/services/orderBookServices'
import { OrderBookUpdateType } from './core/enums/order/OrderBookUpdateType'
import OrderBookRow from './components/UI/OrderBookRow.vue'
import icon from './assets/svg/IconArrowDown.svg'
import { formatNumber } from './core/services/commonServices'
import { PriceChangeStatus } from './core/enums/price/PriceChangeStatus'

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
/** 當前最新價格 */
const currentTrade = ref<TradeData | null>(null)
/** 上一筆最新價格 */
const previousTrade = ref<TradeData | null>(null)
/** 當前所有訂單簿數據 */
const orderBook = reactive<OrderBookData>({
  asks: [],
  bids: []
})
/** 上一筆訂單簿數據 */
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
    if (data.length > 2) {
      previousTrade.value = data[0]
      currentTrade.value = data[1]
    } else if (data.length === 1) {
      previousTrade.value = currentTrade.value
      currentTrade.value = data[0]
    }
    console.log('📈 Trade History:', data)
    // tradeHistory.push(...data)
  }
})

/** 顯示訂單簿 */
const displayOrderBook = computed(() => {
  return {
    asks: orderBook.asks.slice(0, 8),
    bids: orderBook.bids.slice(0, 8)
  }
})

/** 最新成交狀態 */
const latestTradeStatus = computed(() => {
  if (!previousTrade.value || !currentTrade.value) {
    return {
      status: PriceChangeStatus.Same,
      price: currentTrade.value?.price || 0,
      side: currentTrade.value?.side
    }
  }

  const { price: currentPrice, side } = currentTrade.value
  const { price: previousPrice } = previousTrade.value

  return {
    status: currentPrice > previousPrice ? PriceChangeStatus.Up :
           currentPrice < previousPrice ? PriceChangeStatus.Down :
           PriceChangeStatus.Same,
    price: currentPrice,
    side
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
    <div class="order-book--last-price">
      <span>{{ formatNumber(parseFloat(latestTradeStatus.price.toString() || '0')) }}</span>
      <img 
        :src="icon" 
        alt="arrow-down" 
        :class="{
          'icon--up': latestTradeStatus.status === PriceChangeStatus.Up || latestTradeStatus.status === PriceChangeStatus.Same,
          'icon--down': latestTradeStatus.status === PriceChangeStatus.Down || latestTradeStatus.status === PriceChangeStatus.Same
        }"
      />
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
.icon--up {
  filter: invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%);
  transform: rotate(180deg);
}

.icon--down {
  filter: invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%);
}
</style>
