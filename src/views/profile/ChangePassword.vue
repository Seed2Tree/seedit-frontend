<template>
  <div class="page">
    <div class="content">
      <form class="form" @submit.prevent="onSave">
        <div class="field">
          <label class="label">현재 비밀번호</label>
          <div class="input-wrap">
            <input
              v-model="currentPassword"
              :type="show.current ? 'text' : 'password'"
              class="input"
              placeholder="현재 비밀번호를 입력해주세요"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="eye"
              @click="show.current = !show.current"
              aria-label="표시"
            >
              <component :is="show.current ? EyeOff : Eye" :size="20" />
            </button>
          </div>
        </div>
        <div class="field">
          <label class="label">새 비밀번호</label>
          <div class="input-wrap">
            <input
              v-model="newPassword"
              :type="show.next ? 'text' : 'password'"
              class="input"
              placeholder="새 비밀번호를 입력해주세요"
              autocomplete="new-password"
            />
            <button type="button" class="eye" @click="show.next = !show.next" aria-label="표시">
              <component :is="show.next ? EyeOff : Eye" :size="20" />
            </button>
          </div>
          <div v-if="newPassword && !passwordValid" class="alert alert--err">
            영문, 숫자, 특수문자 포함 8~20자로 작성해주세요.
          </div>
          <div v-else-if="sameAsCurrent" class="alert alert--err">
            현재 비밀번호와 다른 비밀번호를 입력해주세요.
          </div>
        </div>

        <div class="field">
          <label class="label">새 비밀번호 확인</label>
          <div class="input-wrap">
            <input
              v-model="confirmPassword"
              :type="show.confirm ? 'text' : 'password'"
              class="input"
              placeholder="새 비밀번호를 다시 입력해주세요"
              autocomplete="new-password"
            />
            <button
              type="button"
              class="eye"
              @click="show.confirm = !show.confirm"
              aria-label="표시"
            >
              <component :is="show.confirm ? EyeOff : Eye" :size="20" />
            </button>
          </div>
          <div v-if="mismatch" class="alert alert--err">비밀번호가 일치하지 않아요.</div>
        </div>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="done" class="success">✓ 비밀번호가 변경되었어요.</p>
      </form>
    </div>

    <footer class="footer">
      <button class="primary" :disabled="loading || !canSubmit" @click="onSubmit">
        <span v-if="loading" class="spinner" />
        <span v-else>변경하기</span>
      </button>
    </footer>
  </div>
</template>

<script setup>
import { authApi } from '@/api/auth'
import { userApi } from '@/api/user'
import { Eye, EyeOff } from 'lucide-vue-next'
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const done = ref(false)

const form = reactive({ username: '', name: '', email: '', avatarUrl: '' })
const original = ref({})

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const show = reactive({ current: false, next: false, confirm: false })

const PW_RE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/
const passwordValid = computed(() => PW_RE.test(newPassword.value))
const sameAsCurrent = computed(
  () => newPassword.value !== '' && newPassword.value === currentPassword.value,
)
const mismatch = computed(
  () => confirmPassword.value !== '' && newPassword.value !== confirmPassword.value,
)

const canSubmit = computed(
  () =>
    currentPassword.value !== '' &&
    passwordValid.value &&
    !sameAsCurrent.value &&
    confirmPassword.value !== '' &&
    !mismatch.value,
)

async function onSubmit() {
  if (!canSubmit.value || loading.value) return
  loading.value = true
  error.value = ''
  done.value = false
  try {
    // TODO: await authApi.changePassword({ currentPassword: currentPassword.value, newPassword: newPassword.value })
    done.value = true
    await userApi.changePassword({
      // currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })
    setTimeout(() => router.back(), 800)
  } catch (e) {
    // 현재 비밀번호 불일치(보통 400/401) 등
    error.value = e.response?.data?.message || '현재 비밀번호가 올바르지 않거나 변경에 실패했어요.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  color: #1e1a2e;
  font-family: Pretendard;
}
.content {
  overflow-y: auto;
  padding: 16px 24px 24px;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.label {
  font-size: 13px;
  font-weight: 600;
  color: #7a7388;
}
.input-wrap {
  position: relative;
}
.input {
  width: 100%;
  box-sizing: border-box;
  height: 54px;
  border-radius: 14px;
  border: 1.5px solid #e4e2ed;
  background: #fff;
  padding: 0 48px 0 16px;
  font-size: 15px;
  color: #1e1a2e;
  outline: none;
  transition: border-color 0.15s;
  font-family: Pretendard;
}
.input:focus {
  border-color: #7c5cff;
}
.input::placeholder {
  color: #c0bbc9;
}
.eye {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9a97ae;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.alert {
  font-size: 11px;
  font-weight: 500;
}
.alert--err {
  color: #e53935;
}
.error {
  font-size: 13px;
  color: #e53935;
  text-align: center;
  margin: 4px 0 0;
}
.success {
  font-size: 13px;
  color: #16a34a;
  text-align: center;
  margin: 4px 0 0;
}
.footer {
  display: flex;
  flex-direction: column;
  padding: 12px;
}
.primary {
  height: 54px;
  border-radius: 16px;
  background: #7c5cff;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Pretendard;
  transition:
    opacity 0.15s,
    transform 0.08s;
}
.primary:active {
  transform: scale(0.98);
}
.primary:disabled {
  opacity: 0.6;
  cursor: default;
}
.spinner {
  width: 22px;
  height: 22px;
  border: 2.5px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
