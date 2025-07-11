<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { OrderSide } from './core/enums/order/OrderSide'
import OrderBookRow from './components/UI/OrderBookRow.vue'
import Loading from './components/UI/Loading.vue'
import icon from './assets/svg/IconArrowDown.svg'
import { formatNumber } from './core/services/commonServices'
import { StatusChangeEnum } from './core/enums/system/StatusChangeEnum'
import { SizeNameEnum } from './core/enums/system/SizeNameEnum'
import { useOrderBook } from './core/composable/useOrderBook'
import { useTradeHistory } from './core/composable/useTradeHistory'

/** 使用訂單簿相關功能的composable */
const {
  /** 訂單簿數據加載狀態 */
  isLoading: orderBookLoading,
  /** 當前展示的訂單簿數據 */
  displayOrderBook,
  /** 前一次展示的訂單簿數據,用於計算變化狀態 */
  previousDisplayedOrderBook,
  /** 連接訂單簿WebSocket的方法 */
  connectOrderBook,
  /** 斷開訂單簿WebSocket連接的方法 */
  disconnectOrderBook
} = useOrderBook()

/** 使用交易歷史相關功能的composable */
const {
  /** 交易歷史數據加載狀態 */
  isLoading: tradeLoading,
  /** 最新成交狀態 */
  latestTradeStatus,
  /** 連接交易歷史WebSocket的方法 */
  connectTradeHistory,
  /** 斷開交易歷史WebSocket連接的方法 */
  disconnectTradeHistory
} = useTradeHistory()

/** 組合加載狀態 - 當訂單簿或交易歷史任一在加載時為true */
const isLoading = computed(() => orderBookLoading.value || tradeLoading.value)

/** 組件掛載時連接WebSocket */
onMounted(() => {
  connectOrderBook()
  connectTradeHistory()
})

/** 組件卸載前斷開WebSocket連接 */
onBeforeUnmount(() => {
  disconnectOrderBook()
  disconnectTradeHistory()
})
</script>

<template>
  <div class="order-book">
    <!-- 載入狀態顯示 -->
    <div v-if="isLoading" class="">
      <Loading 
        :text="orderBookLoading ? 'Loading Order Book...' : 'Loading Trade History...'"
        :size="SizeNameEnum.LARGE"
      />
    </div>
    
    <!-- 主要內容區域 -->
    <template v-else>
      <!-- 標題 -->
      <h1>Order Book</h1>
      <!-- 表頭 -->
      <div class="order-book--header">
        <div>Price (USD)</div>
        <div>Size</div>
        <div>Total</div>
      </div>
      <!-- 賣單區域 -->
      <div class="order-book--asks">
        <template v-for="ask in displayOrderBook.asks" :key="ask.price">
          <OrderBookRow
            :quote="ask"
            :side="OrderSide.SELL"
            :previousOrderBook="previousDisplayedOrderBook.asks"
            :latestTradeStatus="latestTradeStatus"
            :total="displayOrderBook.asksTotal"
          />
        </template>
      </div>

      <!-- 最新成交價格顯示區域 -->
      <div
        class="order-book--last-price"
        :class="{
          'order-book--last-price--buy': latestTradeStatus.side === OrderSide.BUY,
          'order-book--last-price--sell': latestTradeStatus.side === OrderSide.SELL
        }"
      >
        <span>{{ formatNumber(parseFloat(latestTradeStatus.price.toString() || '0')) }}</span>
        <!-- 價格變化箭頭圖示 -->
        <img 
          :src="icon" 
          alt="arrow-down" 
          :class="{
            'icon--up': latestTradeStatus.status === StatusChangeEnum.Up || latestTradeStatus.status === StatusChangeEnum.Same,
          }"
        />
      </div>

      <!-- 買單區域 -->
      <div class="order-book--bids">
        <template v-for="bid in displayOrderBook.bids" :key="bid.price">
          <OrderBookRow
            :quote="bid"
            :side="OrderSide.BUY"
            :previousOrderBook="previousDisplayedOrderBook.bids"
            :latestTradeStatus="latestTradeStatus"
            :total="displayOrderBook.bidsTotal"
          />
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.icon--up {
  transform: rotate(180deg);
}
</style>
