<template>
  <div class="main-layout">
    <RouterView />
    <BottomTabBar />
  </div>
</template>

<script setup>
import BottomTabBar from '@/components/BottomTabBar.vue'
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  position: relative;
}
</style>
