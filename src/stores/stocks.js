import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { stocksApi } from '@/api/stocks'
import { watchlistApi } from '@/api/watchlist'

export const useStocksStore = defineStore('stocks', () => {
  const stocks = ref([])          // 전체 종목 리스트
  const watchlistIds = ref([])    // 관심종목 stockId 목록
  const isLoading = ref(false)
  const error = ref(null)

  // 관심종목 필터링
  const watchlistStocks = computed(() =>
    stocks.value.filter((s) => watchlistIds.value.includes(s.sid))
  )

  // 오늘 가장 많이 오른 종목 TOP 3
  const trendingStocks = computed(() =>
    [...stocks.value]
      .sort((a, b) => b.changeRate - a.changeRate)
      .slice(0, 3)
  )

  // 전체 종목 + 관심종목 목록 불러오기
  async function fetchList() {
    isLoading.value = true
    error.value = null
    try {
      const stocksRes = await stocksApi.getList()
      stocks.value = stocksRes.data
    } catch (e) {
      error.value = e
    }
    // 관심종목은 로그인 후 별도 로드 (실패해도 종목 목록은 표시)
    try {
      const watchlistRes = await watchlistApi.getList()
      watchlistIds.value = watchlistRes.data.map((w) => w.sid)
    } catch {
      watchlistIds.value = []
    } finally {
      isLoading.value = false
    }
  }

  // 관심종목 토글 (추가/삭제)
  async function toggleWatchlist(stockId) {
    const isWatched = watchlistIds.value.includes(stockId)
    // 낙관적 업데이트 (API 결과 기다리지 않고 즉시 UI 반영)
    if (isWatched) {
      watchlistIds.value = watchlistIds.value.filter((id) => id !== stockId)
    } else {
      watchlistIds.value.push(stockId)
    }
    try {
      if (isWatched) {
        await watchlistApi.remove(stockId)
      } else {
        await watchlistApi.add(stockId)
      }
    } catch (e) {
      // 실패 시 롤백
      if (isWatched) {
        watchlistIds.value.push(stockId)
      } else {
        watchlistIds.value = watchlistIds.value.filter((id) => id !== stockId)
      }
    }
  }

  function isWatched(stockId) {
    return watchlistIds.value.includes(stockId)
  }

  return {
    stocks,
    watchlistIds,
    watchlistStocks,
    trendingStocks,
    isLoading,
    error,
    fetchList,
    toggleWatchlist,
    isWatched,
  }
})
