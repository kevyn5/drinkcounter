<template>
  <!-- External link -->
  <q-item v-if="props.link && props.link.startsWith('http')" clickable tag="a" target="_blank" :href="props.link">
    <q-item-section v-if="props.icon" avatar>
      <q-icon :name="props.icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ props.title }}</q-item-label>
      <q-item-label caption>{{ props.caption }}</q-item-label>
    </q-item-section>
  </q-item>

  <!-- Internal navigation -->
  <q-item v-else clickable @click="handleInternalNavigation">
    <q-item-section v-if="props.icon" avatar>
      <q-icon :name="props.icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ props.title }}</q-item-label>
      <q-item-label caption>{{ props.caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup>
/* eslint-disable */
import { useRouter } from 'vue-router'

const router = useRouter()
const emit = defineEmits(['navigate']) // Used in handleInternalNavigation

const props = defineProps({
  title: {
    type: String,
    required: true,
  },

  caption: {
    type: String,
    default: '',
  },

  link: {
    type: String,
    default: '#',
  },

  icon: {
    type: String,
    default: '',
  },
})

const handleInternalNavigation = () => {
  if (props.link && props.link !== '#') {
    router.push(props.link)
    // Small delay to show the click feedback before closing drawer
    setTimeout(() => {
      emit('navigate')
    }, 100)
  }
}
</script>
