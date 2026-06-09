import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(localStorage.getItem('accessToken') || null)
  const user = ref(null)

  const isLoggedIn = computed(() => !!accessToken.value)

  async function login(email, password) {
    const res = await authApi.login(email, password)
    // 백엔드 응답: { accessToken, refreshToken, tokenType, email }
    // client.js 인터셉터가 res.data를 이미 벗겨줌
    const { accessToken: token, email: userEmail } = res
    accessToken.value = token
    user.value = { email: userEmail }
    localStorage.setItem('accessToken', token)
  }

  function logout() {
    accessToken.value = null
    user.value = null
    localStorage.removeItem('accessToken')
  }

  return { accessToken, user, isLoggedIn, login, logout }
})
