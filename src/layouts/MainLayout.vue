<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> Drink Calendar</q-toolbar-title>

        <!-- Layout Toggle -->
        <q-btn-group flat>
          <q-btn
            flat
            dense
            :icon="layoutStore.getLayoutMode() === 'auto' ? 'devices' : layoutStore.getLayoutMode() === 'mobile' ? 'phone_android' : 'desktop_windows'"
            :color="layoutStore.getLayoutMode() !== 'auto' ? 'primary' : 'white'"
            @click="toggleLayout"
          >
            <q-tooltip>
              Current: {{ layoutStore.getLayoutMode() === 'auto' ? 'Auto' : layoutStore.getLayoutMode() === 'mobile' ? 'Mobile' : 'Desktop' }} Layout
            </q-tooltip>
          </q-btn>
        </q-btn-group>

        <div class="q-ml-md"> v 1.1 </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Essential Links </q-item-label>

        <NavigationLink
          v-for="link in linksList"
          :key="link.title"
          v-bind="link"
          @navigate="closeDrawer"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NavigationLink from 'components/NavigationLink.vue'
import { useLayoutStore } from 'src/stores/layout-store'

const router = useRouter()
const layoutStore = useLayoutStore()

// Initialize layout store
onMounted(() => {
  layoutStore.initialize()
})

// Toggle layout mode
const toggleLayout = () => {
  const currentMode = layoutStore.getLayoutMode()
  const modes = ['auto', 'desktop', 'mobile']
  const currentIndex = modes.indexOf(currentMode)
  const nextMode = modes[(currentIndex + 1) % modes.length]

  layoutStore.setLayoutMode(nextMode)

  // Refresh the current page to apply new layout
  router.go(0)
}

const linksList = [
  {
    title: 'Home',
    caption: 'Drink counter calendar',
    icon: 'home',
    link: '/',
  },
  {
    title: 'Personal Data',
    caption: 'Manage your personal information',
    icon: 'person',
    link: '/personal-data',
  },
  {
    title: 'Beverage Guide',
    caption: 'Manage beverages and reference guide',
    icon: 'local_bar',
    link: '/beverage-guide',
  },
  {
    title: 'Docs',
    caption: 'quasar.dev',
    icon: 'school',
    link: '#',
  },
  {
    title: 'Path2Help - Drug & Alcohol Support',
    caption: 'Free confidential support - adf.org.au',
    icon: 'support_agent',
    link: 'https://adf.org.au/help-support/path2help/',
  },
  {
    title: 'Statistics',
    caption: 'View your drinking statistics',
    icon: 'analytics',
    link: '/statistics',
  },
]

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function closeDrawer() {
  leftDrawerOpen.value = false
}
</script>
