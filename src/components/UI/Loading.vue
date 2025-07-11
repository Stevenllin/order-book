<template>
  <div class="loading-container" :class="`size-${size}`">
    <div class="loading-spinner">
      <div class="spinner">
        <div class="spinner-inner"></div>
      </div>
    </div>
    <div v-if="text" class="loading-text">{{ text }}</div>
  </div>
</template>

<script setup lang="ts">
import { SizeNameEnum } from '../../core/enums/system/SizeNameEnum'

interface Props {
  text?: string
  size?: SizeNameEnum
}

withDefaults(defineProps<Props>(), {
  text: '',
  size: SizeNameEnum.MEDIUM
})
</script>

<style scoped>

</style> 