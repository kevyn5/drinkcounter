<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useDrinksStore } from './stores/drinks-store'
import { usePersonalDataStore } from './stores/personal-data-store'

// Initialize stores when app starts
onMounted(() => {
  const drinksStore = useDrinksStore()
  const personalDataStore = usePersonalDataStore()

  drinksStore.initialize()
  personalDataStore.initialize()
})
</script>
