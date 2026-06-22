import { ref } from 'vue'
import { defineStore } from 'pinia'
import { diaryApi, tradeCalendarApi } from '@/api/diary'

export const useDiaryStore = defineStore('diary', () => {
  const diaryList = ref([])
  const diaryCalendarDates = ref([]) // 일지 있는 날짜 목록 (LocalDate[])
  const tradeCalendar = ref([])      // [{ tradeDate, hasBuy, hasSell }]
  const tradeList = ref([])          // 전체 거래내역 (일지 목록 피드용)
  const currentDiary = ref(null)     // 날짜별 일지 상세 (null = 미작성)
  const currentTrades = ref([])      // 날짜별 거래내역
  const isLoading = ref(false)
  const error = ref(null)

  async function fetchList() {
    isLoading.value = true
    error.value = null
    try {
      const res = await diaryApi.getList()
      diaryList.value = res.data
    } catch (e) {
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTradeList() {
    try {
      const res = await tradeCalendarApi.getAll()
      tradeList.value = res.data ?? []
    } catch (e) {
      error.value = e
    }
  }

  async function fetchCalendar(year, month) {
    try {
      const [diaryRes, tradeRes] = await Promise.all([
        diaryApi.getCalendar(year, month),
        tradeCalendarApi.getCalendar(year, month),
      ])
      diaryCalendarDates.value = diaryRes.data
      tradeCalendar.value = tradeRes.data
    } catch (e) {
      error.value = e
    }
  }

  async function fetchDateDetail(date) {
    isLoading.value = true
    error.value = null
    try {
      const [diaryRes, tradeRes] = await Promise.all([
        diaryApi.getByDate(date),
        tradeCalendarApi.getByDate(date),
      ])
      currentDiary.value = diaryRes.data   // null이면 미작성 상태
      currentTrades.value = tradeRes.data
    } catch (e) {
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  async function saveDiary(date, content) {
    if (currentDiary.value?.did) {
      const res = await diaryApi.update(currentDiary.value.did, content)
      currentDiary.value = res.data
    } else {
      const res = await diaryApi.create(date, content)
      currentDiary.value = res.data
    }
  }

  async function deleteDiary() {
    if (!currentDiary.value?.did) return
    await diaryApi.delete(currentDiary.value.did)
    currentDiary.value = null
  }

  async function generateFeedback(date) {
    const res = await diaryApi.generateFeedback(date)
    if (!res.data) {
      throw new Error(res.message ?? 'AI 피드백 생성에 실패했습니다.')
    }
    currentDiary.value = res.data
  }

  function hasDiary(dateStr) {
    return diaryCalendarDates.value.includes(dateStr)
  }

  function tradeDotsFor(dateStr) {
    return tradeCalendar.value.find((t) => t.tradeDate === dateStr) ?? null
  }

  return {
    diaryList,
    diaryCalendarDates,
    tradeCalendar,
    tradeList,
    currentDiary,
    currentTrades,
    isLoading,
    error,
    fetchList,
    fetchTradeList,
    fetchCalendar,
    fetchDateDetail,
    saveDiary,
    deleteDiary,
    generateFeedback,
    hasDiary,
    tradeDotsFor,
  }
})
