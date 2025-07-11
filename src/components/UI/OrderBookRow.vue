<script setup lang="ts">
import { OrderSide } from '../../core/enums/order/OrderSide'
import { formatNumber } from '../../core/services/commonServices'
import { computed } from 'vue'
import type { OrderBookEntry } from '../../core/services/orderBookServices'
import { StatusChangeEnum } from '../../core/enums/system/StatusChangeEnum'

/** 訂單報價類型定義 */
type Quote = {
  /** 價格 */
  price: number
  /** 數量 */
  size: number
  /** 累計總量 */
  total: number
}

/** 組件屬性定義 */
const props = defineProps<{
  /** 當前報價數據 */
  quote: Quote
  /** 訂單方向(買/賣) */
  side: OrderSide
  /** 前一次訂單簿數據,用於計算變化狀態 */
  previousOrderBook: OrderBookEntry[]
  /** 訂單簿總量,用於計算深度條 */
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
  <!-- 訂單簿行元素 -->
  <div
    class="order-book-row"
    :class="{ 
      'order-book-row--buy': side === OrderSide.BUY, 
      'order-book-row--sell': side === OrderSide.SELL 
    }"
    :style="{
      /* 新增訂單時的背景顏色 - 買入為綠色,賣出為紅色 */
      background: previousOrderData.isNewEntry && side === OrderSide.BUY ? 'rgba(0, 177, 93, 0.5)' : previousOrderData.isNewEntry && side === OrderSide.SELL ? 'rgba(255, 91, 90, 0.5)' : ''
    }"
  >
    <!-- 價格列 -->
    <div class="order-book-row--price">
      {{ formatNumber(quote.price) }}
    </div>

    <!-- 數量列 - 根據數量變化顯示不同狀態 -->
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

    <!-- 總量列 -->
    <div class="order-book-row--total">
      <!-- 深度條 - 顯示當前價格層級的累計量佔總量的比例 -->
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
      <!-- 總量數值 -->
      <div style="position: relative; z-index: 2">
        {{ formatNumber(quote.total) }}
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>    