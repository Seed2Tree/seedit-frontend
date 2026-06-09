import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // TODO: 로그인 구현 전까지 true로 고정 (개발용)
  const isLoggedIn = ref(true)
  const user = ref(null)

  function login(userData) {
    isLoggedIn.value = true
    user.value = userData
  }

  function logout() {
    isLoggedIn.value = false
    user.value = null
  }

  return { isLoggedIn, user, login, logout }
})
