<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> Drink Calendar</q-toolbar-title>

        <div> v 1.0 </div>
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
import { ref } from 'vue'
import NavigationLink from 'components/NavigationLink.vue'

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
