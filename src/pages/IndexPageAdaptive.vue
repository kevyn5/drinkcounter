<template>
  <component :is="selectedPageComponent" />
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useLayoutStore } from 'src/stores/layout-store'
import IndexPageDesktop from './IndexPage.vue'
import IndexPageMobile from './IndexPageMobile.vue'

const $q = useQuasar()
const layoutStore = useLayoutStore()

// Initialize layout store
onMounted(() => {
  layoutStore.initialize()
})

// Select appropriate page component based on layout preference
const selectedPageComponent = computed(() => {
  const shouldUseMobile = layoutStore.shouldUseMobileLayout($q.screen)
  return shouldUseMobile ? IndexPageMobile : IndexPageDesktop
})
</script>
