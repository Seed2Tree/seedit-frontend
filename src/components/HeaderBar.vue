<template>
  <header class="header">
    <div v-if="backMode">
      <button class="back" @click="$router.back()" aria-label="뒤로">
        <ChevronLeft :size="28" />
      </button>
    </div>
    <div v-else>
      <div class="space"></div>
    </div>
    <div v-if="logoMode && title == ''">
      <img class="logo" src="/src/assets/seedit.svg" />
    </div>
    <div v-else>
      <h1 class="title">{{ title }}</h1>
    </div>
    <div v-if="star">
      <button aria-label="관심종목">
        <Star :size="28" />
      </button>
    </div>
    <div v-else>
      <div class="space"></div>
    </div>
  </header>
</template>

<script setup>
import { ChevronLeft, Star } from 'lucide-vue-next'
defineProps({
  logoMode: { type: Boolean, default: true },
  backMode: { type: Boolean, default: false },
  title: { type: String, default: '' },
  star: { type: Boolean, default: false },
})
</script>

<style scoped>
.header {
  display: flex;
  height: 56px;
  padding: 0 12px;
  align-items: center;
  align-self: stretch;
  justify-content: center;
}

.back {
  display: flex;
  width: 44px;
  height: 44px;
  justify-content: center;
  align-items: center;
  border: none;
  background: none;
  cursor: pointer;
}

.title {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  flex: 1 0 0;
  width: 280px;
  color: var(--Mirage, var(--color-blue-14, #1e1a2e));
  text-align: center;

  font-size: var(--font-size-16, 16px);
  font-style: normal;
  font-weight: var(--font-weight-600, 600);
  line-height: var(--line-height-21_6, 21.6px); /* 135% */
  letter-spacing: var(--letter-spacing--0_19, -0.192px);
}

.space {
  display: flex;
  width: 44px;
  height: 44px;
  justify-content: center;
  align-items: center;
  border: none;
  background: none;
  cursor: pointer;
}
.div {
}

.logo {
  width: 70px;
}
</style>
