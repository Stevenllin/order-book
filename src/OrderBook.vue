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

// Use the composables
const {
  isLoading: orderBookLoading,
  displayOrderBook,
  previousDisplayedOrderBook,
  connectOrderBook,
  disconnectOrderBook
} = useOrderBook()

const {
  isLoading: tradeLoading,
  latestTradeStatus,
  connectTradeHistory,
  disconnectTradeHistory
} = useTradeHistory()

// Combined loading state
const isLoading = computed(() => orderBookLoading.value || tradeLoading.value)

// Connect to WebSockets when component is mounted
onMounted(() => {
  connectOrderBook()
  connectTradeHistory()
})

onBeforeUnmount(() => {
  disconnectOrderBook()
  disconnectTradeHistory()
})
</script>

<template>
  <div class="order-book">
    <!-- Loading State -->
    <div v-if="isLoading" class="">
      <Loading 
        :text="orderBookLoading ? 'Loading Order Book...' : 'Loading Trade History...'"
        :size="SizeNameEnum.LARGE"
      />
    </div>
    
    <!-- Actual Content -->
    <template v-else>
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
          <OrderBookRow
            :quote="ask"
            :side="OrderSide.SELL"
            :previousOrderBook="previousDisplayedOrderBook.asks"
            :latestTradeStatus="latestTradeStatus"
            :total="displayOrderBook.asksTotal"
          />
        </template>
      </div>

      <!-- Current Trade -->
      <div
        class="order-book--last-price"
        :class="{
          'order-book--last-price--buy': latestTradeStatus.side === OrderSide.BUY,
          'order-book--last-price--sell': latestTradeStatus.side === OrderSide.SELL
        }"
      >
        <span>{{ formatNumber(parseFloat(latestTradeStatus.price.toString() || '0')) }}</span>
        <img 
          :src="icon" 
          alt="arrow-down" 
          :class="{
            'icon--up': latestTradeStatus.status === StatusChangeEnum.Up || latestTradeStatus.status === StatusChangeEnum.Same,
          }"
        />
      </div>

      <!-- Bids 買方 -->
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
