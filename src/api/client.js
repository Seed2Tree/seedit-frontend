import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
})

// 요청마다 저장된 토큰을 Authorization 헤더에 붙임
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
let isRefreshing = false
let waiters = [] // refresh 진행 중 대기하는 요청들

client.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const original = err.config
    const status = err.response?.status

    // 401이 아니거나, 이미 재시도했거나, refresh 호출 자체면 그냥 실패 처리
    if (status !== 401 || original._retry || original.url?.includes('/auth/refresh')) {
      return Promise.reject(err)
    }

    // 이미 누가 refresh 중이면, 끝날 때까지 기다렸다가 재시도
    if (isRefreshing) {
      return new Promise((resolve, reject) => waiters.push({ resolve, reject })).then(
        (newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`
          return client(original)
        },
      )
    }

    original._retry = true
    isRefreshing = true

    try {
      const data = await client.post('/auth/refresh') // 쿠키로 새 access token 발급
      const newToken = data.accessToken // ← 프로젝트 응답 구조에 맞춤 (login과 동일)
      localStorage.setItem('accessToken', newToken)

      waiters.forEach((w) => w.resolve(newToken)) // 대기 요청들 깨우기
      waiters = []

      original.headers.Authorization = `Bearer ${newToken}`
      return client(original) // 원래 요청 재시도
    } catch (refreshErr) {
      waiters.forEach((w) => w.reject(refreshErr))
      waiters = []
      // refresh도 실패 = 세션 만료 → 정리하고 로그인으로
      localStorage.removeItem('accessToken')
      window.location.href = '/login'
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  },
)

export default client
