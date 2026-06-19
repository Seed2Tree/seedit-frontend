<template>
  <div class="main-layout">
    <HeaderBar
      :title="headerStore.title"
      :back-mode="headerStore.backMode"
      :logo-mode="headerStore.logoMode"
      :star="headerStore.star"
      :is-starred="headerStore.isStarred"
      @star-click="headerStore.onStarClick?.()"
    />
    <main class="content"><RouterView /></main>
    <BottomTabBar v-if="!route.meta.hideTabBar" />
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import BottomTabBar from '@/components/BottomTabBar.vue'
import HeaderBar from '@/components/HeaderBar.vue'
import { useHeaderStore } from '@/stores/header'

const route = useRoute()
const headerStore = useHeaderStore()
</script>

<style scoped>
.main-layout {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  overflow-y: auto;
}
</style>
