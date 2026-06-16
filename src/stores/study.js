import { ref } from 'vue'
import { defineStore } from 'pinia'
import { studyApi } from '@/api/study'

export const CATEGORIES = ['전체', '재테크', '투자', '소비습관', '부동산', '노후준비', '부채·신용']

export const useStudyStore = defineStore('study', () => {
  const videos = ref([])
  const selectedCategory = ref('전체')
  const selectedVideo = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  async function fetchList(category = selectedCategory.value) {
    selectedCategory.value = category
    isLoading.value = true
    error.value = null
    try {
      const res = await studyApi.getList(category === '전체' ? null : category)
      videos.value = res.data
    } catch (e) {
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDetail(isid) {
    isLoading.value = true
    error.value = null
    try {
      const res = await studyApi.getDetail(isid)
      selectedVideo.value = res.data
    } catch (e) {
      error.value = e
      selectedVideo.value = null
    } finally {
      isLoading.value = false
    }
  }

  function videoIdFrom(youtubeUrl) {
    return youtubeUrl?.match(/v=([^&]+)/)?.[1] ?? null
  }

  return { videos, selectedCategory, selectedVideo, isLoading, error, fetchList, fetchDetail, videoIdFrom }
})
