import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  // Layout preference: 'auto', 'desktop', 'mobile'
  const layoutMode = ref('auto')

  // Initialize from localStorage
  const initialize = () => {
    const saved = localStorage.getItem('drink-counter-layout-mode')
    if (saved && ['auto', 'desktop', 'mobile'].includes(saved)) {
      layoutMode.value = saved
    }
  }

  // Set layout mode
  const setLayoutMode = (mode) => {
    if (['auto', 'desktop', 'mobile'].includes(mode)) {
      layoutMode.value = mode
      localStorage.setItem('drink-counter-layout-mode', mode)
    }
  }

  // Get current layout mode
  const getLayoutMode = () => layoutMode.value

  // Check if should use mobile layout
  const shouldUseMobileLayout = (screenSize) => {
    if (layoutMode.value === 'mobile') return true
    if (layoutMode.value === 'desktop') return false
    // Auto mode - use screen size
    return screenSize.lt.md
  }

  return {
    layoutMode,
    initialize,
    setLayoutMode,
    getLayoutMode,
    shouldUseMobileLayout
  }
})
