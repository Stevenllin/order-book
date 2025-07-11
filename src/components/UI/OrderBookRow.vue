<script setup lang="ts">
import { OrderSide } from '../../core/enums/order/OrderSide'
import { formatNumber } from '../../core/services/commonServices'
import { computed } from 'vue'
import type { OrderBookEntry } from '../../core/services/orderBookServices'

type Quote = {
  price: number
  size: number
  total: number
}

const props = defineProps<{
  quote: Quote
  side: OrderSide
  previousOrderBook: OrderBookEntry[]
  total: number
}>()

/** 判斷是否為新增進來的 */
const isInList = computed(() => {
  const set = new Set(props.previousOrderBook.map(el => el.price))
  return set.has(props.quote.price)
})

/** 判斷大小變化 */
const sizeChangeStatus = computed(() => {
  const previousSize = props.previousOrderBook.find(el => el.price === props.quote.price)?.size
  if (previousSize === undefined) {
    return 'new'
  }
  return previousSize > props.quote.size ? 'down' : previousSize < props.quote.size ? 'up' : 'same'
})
</script>

<template>
  <div
    class="order-book-row"
    :class="{ 'order-book-row--buy': side === OrderSide.BUY, 'order-book-row--sell': side === OrderSide.SELL }"
    :style="{
      background: isInList && side === OrderSide.BUY ? 'rgba(0, 177, 93, 0.5)' : isInList && side === OrderSide.SELL ? 'rgba(255, 91, 90, 0.5)' : ''
    }"
  >
    <div class="order-book-row--price">
      {{ formatNumber(quote.price) }}
    </div>
    <div
      class="order-book-row--size"
      :class="{
        'order-book-row--size--up': sizeChangeStatus === 'up',
        'order-book-row--size--down': sizeChangeStatus === 'down',
        'order-book-row--size--same': sizeChangeStatus === 'same'
      }"
    >
      {{ formatNumber(quote.size) }}
    </div>
    <div class="order-book-row--total">
      <div
        class="order-book-row--total-bar"
        :style="{
          width: `${quote.total / total * 100}%`,
          background: side === OrderSide.BUY ? 'rgba(16, 186, 104, 0.12)' : 'rgba(255, 90, 90, 0.12)',
          position: 'absolute',
          height: '100%',
          right: 0,
          top: 0,
          zIndex: 1
        }"
      ></div>
      <div style="position: relative; z-index: 2">
        {{ formatNumber(quote.total) }}
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>    