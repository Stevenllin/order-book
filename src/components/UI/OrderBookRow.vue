<script setup lang="ts">
import { OrderSide } from '../../core/enums/order/OrderSide'
import { formatNumber } from '../../core/services/commonServices'
import { computed } from 'vue'
import type { OrderBookEntry } from '../../core/services/orderBookServices'
import { StatusChangeEnum } from '../../core/enums/system/StatusChangeEnum'

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

/** 獲取前一次訂單數據並判斷狀態 */
const previousOrderData = computed(() => {
  const previousEntry = props.previousOrderBook.find(el => el.price === props.quote.price)
  return {
    isNewEntry: !previousEntry, // 如果前一次沒有這個價格，就是新加入的
    sizeChangeStatus: previousEntry ? 
      (previousEntry.size > props.quote.size ? StatusChangeEnum.Down : 
       previousEntry.size < props.quote.size ? StatusChangeEnum.Up : StatusChangeEnum.Same) : 
      ''
  }
})
</script>

<template>
  <div
    class="order-book-row"
    :class="{ 'order-book-row--buy': side === OrderSide.BUY, 'order-book-row--sell': side === OrderSide.SELL }"
    :style="{
      background: previousOrderData.isNewEntry && side === OrderSide.BUY ? 'rgba(0, 177, 93, 0.5)' : previousOrderData.isNewEntry && side === OrderSide.SELL ? 'rgba(255, 91, 90, 0.5)' : ''
    }"
  >
    <div class="order-book-row--price">
      {{ formatNumber(quote.price) }}
    </div>
    <div
      class="order-book-row--size"
      :class="{
        'order-book-row--size--up': previousOrderData.sizeChangeStatus === StatusChangeEnum.Up,
        'order-book-row--size--down': previousOrderData.sizeChangeStatus === StatusChangeEnum.Down,
        'order-book-row--size--same': previousOrderData.sizeChangeStatus === StatusChangeEnum.Same
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