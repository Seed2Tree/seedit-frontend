<template>
  <Transition name="modal-fade">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal" role="dialog" aria-modal="true">
        <h3 class="modal-title">{{ title }}</h3>
        <p class="modal-message">{{ message }}</p>
        <p class="modal-hint">
          계속하려면 <b>{{ confirmPhrase }}</b> 를 입력하세요.
        </p>
        <input
          v-model.trim="input"
          class="modal-input"
          :placeholder="confirmPhrase"
          @keyup.enter="onConfirm"
        />
        <div class="modal-actions">
          <button class="btn ghost" @click="close">취소</button>
          <button class="btn danger" :disabled="!matched" @click="onConfirm">
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '정말 진행할까요?' },
  message: { type: String, default: '' },
  confirmPhrase: { type: String, required: true }, // 사용자가 똑같이 입력해야 하는 문구
  confirmLabel: { type: String, default: '확인' },
})
const emit = defineEmits(['update:modelValue', 'confirm'])

const input = ref('')
const matched = computed(() => input.value === props.confirmPhrase)

// 열릴 때마다 입력 초기화
watch(
  () => props.modelValue,
  (open) => {
    if (open) input.value = ''
  },
)

function close() {
  emit('update:modelValue', false)
}
function onConfirm() {
  if (!matched.value) return
  emit('confirm')
  close()
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.modal {
  width: 100%;
  max-width: 340px;
  background: #fff;
  border-radius: 16px;
  padding: 22px 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}
.modal-title {
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 8px;
  color: #1e1a2e;
}
.modal-message {
  font-size: 14px;
  color: #555;
  line-height: 1.5;
  margin: 0 0 14px;
}
.modal-hint {
  font-size: 13px;
  color: #777;
  margin: 0 0 8px;
}
.modal-hint b {
  color: #e5484d;
}
.modal-input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 12px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  outline: none;
  margin-bottom: 16px;
}
.modal-input:focus {
  border-color: #b3b3b3;
}
.modal-actions {
  display: flex;
  gap: 10px;
}
.btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.btn.ghost {
  background: #f1f1f3;
  color: #444;
}
.btn.danger {
  background: #e5484d;
  color: #fff;
}
.btn.danger:disabled {
  background: #f0b5b6;
  cursor: not-allowed;
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
