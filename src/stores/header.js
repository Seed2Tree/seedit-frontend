import { defineStore } from 'pinia'

export const useHeaderStore = defineStore('header', {
  state: () => ({
    title: '',
    backMode: false,
    star: false,
    logoMode: true,
    isStarred: false,   // 별 채워진 상태
    onStarClick: null,  // 각 페이지에서 등록하는 클릭 핸들러
  }),
  actions: {
    set(payload) {
      Object.assign(this, payload)
    },
    reset() {
      this.$reset()
    },
  },
})
