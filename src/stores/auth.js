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
    accessToken.value = res.accessToken
    localStorage.setItem('accessToken', res.accessToken)
    setUser({ email: res.email })
  }

  function logout() {
    accessToken.value = null
    user.value = null
    localStorage.removeItem('accessToken')
    sessionStorage.removeItem('user')
  }

  return { accessToken, user, isLoggedIn, setUser, login, logout }
})
