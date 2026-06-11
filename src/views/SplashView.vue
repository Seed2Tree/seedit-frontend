<template>
  <div class="splash-page">
    <div class="splash-inner">
      <div class="logo-icon">🌱</div>
      <div class="logo-title">Seedit</div>
      <div class="logo-sub">모의 투자로 시작하는 첫 투자</div>
      <div class="spinner" />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  // 1.2초 후 자동으로 다음 화면으로 이동
  setTimeout(() => {
    if (authStore.isLoggedIn) {
      router.replace({ name: 'home' })      // 이미 로그인 → 홈으로
    } else {
      router.replace({ name: 'login' })     // 미로그인 → 로그인으로
    }
  }, 1200)
})
</script>

<style scoped>
.splash-page {
  min-height: 100vh;
  background: #7C5CFF;
  display: flex;
  align-items: center;
  justify-content: center;
}
.splash-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.logo-icon {
  font-size: 64px;
  margin-bottom: 4px;
}
.logo-title {
  font-size: 36px;
  font-weight: 800;
  color: white;
  letter-spacing: -0.03em;
}
.logo-sub {
  font-size: 14px;
  color: rgba(255,255,255,0.75);
  margin-bottom: 32px;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
