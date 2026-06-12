<template>
  <div class="main-layout">
    <HeaderBar
      :title="headerStore.title"
      :back-mode="headerStore.backMode"
      :logo-mode="headerStore.logoMode"
      :star="headerStore.star"
    />
    <main class="content"><RouterView /></main>
    <BottomTabBar />
  </div>
</template>

<script setup>
import BottomTabBar from '@/components/BottomTabBar.vue'
import HeaderBar from '@/components/HeaderBar.vue'
import { useHeaderStore } from '@/stores/header'

const headerStore = useHeaderStore()
</script>

<style scoped>
.main-layout {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  overflow-y: auto;
}
</style>
