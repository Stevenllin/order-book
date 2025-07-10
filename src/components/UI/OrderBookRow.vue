<script setup lang="ts">
import { OrderSide } from '../../core/enums/order/OrderSide'
import { formatNumber } from '../../core/services/commonServices'

type Quote = {
  price: number
  size: number
  total: number
}

const props = defineProps<{
  quote: Quote
  side: OrderSide
}>()
</script>

<template>
  <div
    class="order-book-row"
    :class="{ 'order-book-row--buy': side === OrderSide.BUY, 'order-book-row--sell': side === OrderSide.SELL }"
  >
    <div class="order-book-row--price">
      {{ formatNumber(quote.price) }}
    </div>
    <div class="order-book-row--size">
      {{ quote.size }}
    </div>
    <div class="order-book-row--total">
      {{ quote.total }}
    </div>
  </div>
</template>

<style scoped>

</style>    