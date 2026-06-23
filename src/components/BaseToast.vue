<template>
  <Transition name="toast">
    <div v-if="visible" class="toast" role="alert">{{ message }}</div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue'
const visible = ref(false)
const message = ref('')
let timer = null
function show(msg, duration = 2000) {
  message.value = msg
  visible.value = true
  clearTimeout(timer)
  timer = setTimeout(() => (visible.value = false), duration)
}
defineExpose({ show })
</script>

<style scoped>
.toast {
  position: fixed;
  left: 50%;
  bottom: 88px;
  transform: translateX(-50%);
  background: rgba(20, 20, 20, 0.92);
  color: #fff;
  padding: 12px 18px;
  border-radius: 12px;
  font-size: 14px;
  z-index: 1000;
  max-width: 86%;
  text-align: center;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
