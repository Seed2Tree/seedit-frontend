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
  const bookmarkIds = ref([])
  const bookmarks = ref([])

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

  async function fetchBookmarkIds() {
    try {
      const res = await studyApi.getBookmarkIds()
      bookmarkIds.value = res.data
    } catch {
      bookmarkIds.value = []
    }
  }

  async function fetchBookmarks() {
    try {
      const res = await studyApi.getBookmarks()
      bookmarks.value = res.data
    } catch {
      bookmarks.value = []
    }
  }

  async function toggleBookmark(isid) {
    const isBookmarked = bookmarkIds.value.includes(isid)
    // 낙관적 업데이트
    if (isBookmarked) {
      bookmarkIds.value = bookmarkIds.value.filter((id) => id !== isid)
    } else {
      bookmarkIds.value.push(isid)
    }
    try {
      if (isBookmarked) {
        await studyApi.removeBookmark(isid)
      } else {
        await studyApi.addBookmark(isid)
      }
    } catch {
      // 실패 시 롤백
      if (isBookmarked) {
        bookmarkIds.value.push(isid)
      } else {
        bookmarkIds.value = bookmarkIds.value.filter((id) => id !== isid)
      }
    }
  }

  function isBookmarked(isid) {
    return bookmarkIds.value.includes(isid)
  }

  function videoIdFrom(youtubeUrl) {
    return youtubeUrl?.match(/v=([^&]+)/)?.[1] ?? null
  }

  return {
    videos, selectedCategory, selectedVideo, isLoading, error, bookmarkIds, bookmarks,
    fetchList, fetchDetail, fetchBookmarkIds, fetchBookmarks, toggleBookmark, isBookmarked, videoIdFrom,
  }
})
