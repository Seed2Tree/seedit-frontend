import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(localStorage.getItem('accessToken') || null)
  const user = ref(JSON.parse(sessionStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!accessToken.value)

  function setUser(u) {
    user.value = u
    sessionStorage.setItem('user', JSON.stringify(u)) // 항상 JSON으로
  }

  async function login(email, password) {
    const res = await authApi.login(email, password)
    // 백엔드 응답 봉투: { success, data: { accessToken, tokenType, user }, error }
    // client.js 인터셉터가 axios 응답에서 봉투(res.data)까지만 벗겨줌
    const { accessToken: token, user: userInfo } = res.data
    accessToken.value = token
    user.value = userInfo
    localStorage.setItem('accessToken', token)
  }

  function logout() {
    accessToken.value = null
    user.value = null
    localStorage.removeItem('accessToken')
    sessionStorage.removeItem('user')
  }

  return { accessToken, user, isLoggedIn, setUser, login, logout }
})
