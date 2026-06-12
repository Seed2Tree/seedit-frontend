import { defineStore } from 'pinia'

export const useHeaderStore = defineStore('header', {
  state: () => ({ title: '', backMode: false, star: false, logoMode: true }),
  actions: {
    set(payload) {
      Object.assign(this, payload)
    },
    reset() {
      this.$reset()
    },
  },
})
