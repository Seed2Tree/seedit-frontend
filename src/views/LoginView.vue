<template>
  <div class="login-page">
    <div class="login-inner">

      <!-- 로고 -->
      <div class="logo-wrap">
        <div class="logo-icon">🌱</div>
        <div class="logo-title">Seedit</div>
        <div class="logo-sub">모의 투자로 시작하는 첫 투자</div>
      </div>

      <!-- 폼 -->
      <form class="form" @submit.prevent="onSubmit">
        <div class="field">
          <label class="label">이메일</label>
          <input
            v-model="email"
            class="input"
            type="email"
            placeholder="example@email.com"
            autocomplete="email"
            required
          />
        </div>
        <div class="field">
          <label class="label">비밀번호</label>
          <input
            v-model="password"
            class="input"
            type="password"
            placeholder="비밀번호를 입력하세요"
            autocomplete="current-password"
            required
          />
        </div>

        <!-- 에러 메시지 -->
        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <button class="btn-login" type="submit" :disabled="isLoading">
          <span v-if="isLoading" class="spinner" />
          <span v-else>로그인</span>
        </button>
      </form>

      <!-- 회원가입 링크 -->
      <div class="signup-link">
        계정이 없으신가요?
        <button class="link-btn" @click="router.push({ name: 'signup' })">회원가입</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMsg = ref('')

async function onSubmit() {
  isLoading.value = true
  errorMsg.value = ''
  try {
    await authStore.login(email.value, password.value)
    router.push({ name: 'market' })
  } catch (e) {
    errorMsg.value = '이메일 또는 비밀번호를 확인해주세요.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #f7f6fb;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-inner {
  width: 100%;
  max-width: 360px;
}

/* 로고 */
.logo-wrap {
  text-align: center;
  margin-bottom: 40px;
}
.logo-icon {
  font-size: 52px;
  margin-bottom: 8px;
}
.logo-title {
  font-size: 32px;
  font-weight: 800;
  color: #1E1A2E;
  letter-spacing: -0.03em;
}
.logo-sub {
  font-size: 14px;
  color: #7A7388;
  margin-top: 6px;
}

/* 폼 */
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.label {
  font-size: 13px;
  font-weight: 600;
  color: #4A4459;
}
.input {
  height: 52px;
  border-radius: 14px;
  border: 1.5px solid #e4e2ed;
  background: white;
  padding: 0 16px;
  font-size: 15px;
  color: #1E1A2E;
  outline: none;
  transition: border-color 0.15s;
}
.input:focus {
  border-color: #7C5CFF;
}
.input::placeholder {
  color: #C0BBC9;
}

/* 에러 */
.error-msg {
  font-size: 13px;
  color: #E53935;
  text-align: center;
  margin: 0;
}

/* 로그인 버튼 */
.btn-login {
  height: 54px;
  border-radius: 16px;
  background: #7C5CFF;
  color: white;
  font-size: 16px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  margin-top: 4px;
  transition: opacity 0.15s, transform 0.08s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-login:active { transform: scale(0.98); }
.btn-login:disabled { opacity: 0.6; cursor: default; }

.spinner {
  width: 22px;
  height: 22px;
  border: 2.5px solid rgba(255,255,255,0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 회원가입 링크 */
.signup-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #7A7388;
}
.link-btn {
  background: none;
  border: none;
  color: #7C5CFF;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  padding: 0 4px;
}
</style>
