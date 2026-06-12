<template>
  <div class="signup">
    <HeaderBar title="회원가입" />

    <div class="container">
      <h3 class="heading">기본 정보를 알려주세요.</h3>
      <p class="desc">나만의 새싹을 키우려면 몇 가지 정보가 필요해요.</p>

      <form class="form" @submit.prevent="onSubmit">
        <div class="field">
          <label class="label">이름</label>
          <input v-model="form.name" class="input" placeholder="이름을 입력해주세요." />
        </div>

        <div class="field">
          <label class="label">이메일</label>
          <div class="with-btn">
            <input
              v-model="form.email"
              class="input"
              type="email"
              placeholder="이메일을 입력해주세요."
              autocomplete="email"
              required
            />
            <button type="button" class="sub-btn" @click="handleCheckEmail">중복확인</button>
          </div>
          <div
            v-if="emailChecked !== null"
            :class="['alert', emailChecked ? 'alert--ok' : 'alert--err']"
          >
            {{ message }}
          </div>
        </div>

        <div class="field">
          <label class="label">비밀번호</label>
          <input
            v-model="form.password"
            class="input"
            type="password"
            placeholder="비밀번호를 입력해주세요"
            autocomplete="new-password"
            required
          />
          <div v-if="form.password && !passwordValid" class="alert alert--err">
            영문, 숫자, 특수문자 포함 8~20자로 작성해주세요.
          </div>
        </div>

        <div class="field">
          <label class="label">비밀번호 확인</label>
          <input
            v-model="passwordConfirm"
            class="input"
            type="password"
            placeholder="비밀번호를 다시 한번 입력해주세요"
            autocomplete="new-password"
            required
          />
          <div v-if="passwordMismatch" class="alert alert--err">비밀번호가 일치하지 않아요.</div>
        </div>

        <div class="field">
          <label class="label">닉네임</label>
          <input
            v-model="form.username"
            class="input"
            type="text"
            placeholder="사용하실 닉네임을 입력해주세요."
          />
          <span class="hint">앱 안에서 보이는 이름이에요. 언제든 바꿀 수 있어요.</span>
        </div>

        <div class="field">
          <label class="label">생년월일</label>
          <span class="birth-field">
            <input
              v-model="birthY"
              class="Birthinput"
              inputmode="numeric"
              placeholder="2026"
              maxlength="4"
            />
            <input
              v-model="birthM"
              class="Birthinput"
              inputmode="numeric"
              placeholder="06"
              maxlength="2"
            />
            <input
              v-model="birthD"
              class="Birthinput"
              inputmode="numeric"
              placeholder="10"
              maxlength="2"
            />
          </span>
        </div>

        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>

    <footer class="footer">
      <button type="button" class="primary" :disabled="loading || !canSubmit" @click="onSubmit">
        다음
      </button>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import HeaderBar from '@/components/HeaderBar.vue'
import { authApi } from '@/api/auth'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const message = ref('')

const form = reactive({ email: '', name: '', password: '', username: '' })
const passwordConfirm = ref('')
const birthY = ref('')
const birthM = ref('')
const birthD = ref('')
const emailChecked = ref(null) // null(미확인) | true(사용가능) | false(중복/오류)

const PW_RE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/
const passwordValid = computed(() => PW_RE.test(form.password))
const passwordMismatch = computed(
  () => passwordConfirm.value !== '' && form.password !== passwordConfirm.value,
)

const birthFilled = computed(() => /^\d{4}$/.test(birthY.value) && !!birthM.value && !!birthD.value)
const birth = computed(() =>
  birthFilled.value
    ? `${birthY.value}.${birthM.value.padStart(2, '0')}.${birthD.value.padStart(2, '0')}`
    : '',
)

const age = computed(() => {
  if (!birthFilled.value) return null
  const today = new Date()
  let a = today.getFullYear() - Number(birthY.value)
  const before =
    today.getMonth() + 1 < Number(birthM.value) ||
    (today.getMonth() + 1 === Number(birthM.value) && today.getDate() < Number(birthD.value))
  if (before) a -= 1
  return a
})

const canSubmit = computed(
  () =>
    form.name.trim() !== '' &&
    emailChecked.value === true &&
    passwordValid.value &&
    passwordConfirm.value !== '' &&
    !passwordMismatch.value &&
    form.username.trim() !== '' &&
    birthFilled.value &&
    age.value !== null,
)

// 이메일을 수정하면 중복확인 상태를 초기화 (다시 확인하도록)
watch(
  () => form.email,
  () => {
    emailChecked.value = null
    message.value = ''
  },
)

const handleCheckEmail = async () => {
  if (!form.email) {
    emailChecked.value = false
    message.value = '이메일을 입력해주세요.'
    return
  }
  try {
    const res = await authApi.checkEmail(form.email)
    const available = res?.success ?? res?.code == null
    emailChecked.value = available
    message.value = available
      ? (res?.message ?? '✓ 사용 가능한 이메일이에요.')
      : (res?.message ?? '이미 사용 중인 이메일입니다.')
  } catch (err) {
    emailChecked.value = false
    message.value = err.response?.data?.message ?? '확인 중 오류가 발생했어요.'
  }
}

async function onSubmit() {
  if (!canSubmit.value || loading.value) return
  error.value = ''
  loading.value = true
  try {
    await authApi.signup({ ...form, birth: birth.value })
    router.push('/signup/complete')
  } catch (e) {
    error.value = e.response?.data?.message || '회원가입에 실패했어요.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.signup {
  display: flex;
  min-height: 100vh;
  background: #fff;
  flex-direction: column;
  color: black;
}
.container {
  display: flex;
  padding: 24px 24px 32px 24px;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--item-spacing-xs, 8px);
  flex: 1 0 0;
  align-self: stretch;
}
.heading {
  color: var(--Mirage, var(--color-blue-14, #1e1a2e));
  font-size: var(--item-spacing-20, 20px);
  font-weight: var(--font-weight-700, 700);
  line-height: var(--line-height-26, 26px);
  letter-spacing: var(--letter-spacing--0_36, -0.36px);
}
.desc {
  color: var(--Topaz, var(--color-grey-49, #7a7388));
  font-size: var(--font-size-15, 15px);
  font-weight: var(--font-weight-400, 400);
  line-height: var(--line-height-22_5, 22.5px);
  letter-spacing: var(--letter-spacing--0_19, -0.192px);
}
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--item-spacing-6, 6px);
  align-self: stretch;
}
.label {
  align-self: stretch;
  color: var(--Topaz, var(--color-grey-49, #7a7388));
  font-size: var(--font-size-13, 13px);
  font-weight: var(--font-weight-500, 500);
  line-height: var(--line-height-16_9, 16.9px);
  letter-spacing: var(--letter-spacing--0_19, -0.192px);
}
.input {
  display: flex;
  height: 54px;
  border-radius: 14px;
  border: 1.5px solid #e4e2ed;
  background: white;
  padding: 0 16px;
  font-size: 15px;
  color: #1e1a2e;
  outline: none;
  transition: border-color 0.15s;
  align-items: center;
  align-self: stretch;
  font-family: Pretendard;
}
.input:focus {
  border-color: #7c5cff;
}
.input::placeholder {
  color: #c0bbc9;
}
.with-btn {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  align-self: stretch;
}
.sub-btn {
  display: flex;
  height: 54px;
  padding: 0 16px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 16px;
  background: var(--color-blue-14, #1e1a2e);
  color: white;
  font-family: Pretendard;
  white-space: nowrap;
  cursor: pointer;
}
.birth-field {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: var(--item-spacing-xs, 8px);
}
.Birthinput {
  display: flex;
  height: 54px;
  border-radius: 14px;
  border: 1.5px solid #e4e2ed;
  background: white;
  padding: 0 16px;
  font-size: 15px;
  color: #1e1a2e;
  outline: none;
  transition: border-color 0.15s;
  font-family: Pretendard;
  max-width: 104.94px;
}
.alert {
  font-family: var(--font-family-Font-1, Inter);
  font-size: var(--font-size-11, 11px);
  font-weight: var(--font-weight-500, 500);
  line-height: var(--line-height-13_75, 13.75px);
  letter-spacing: var(--letter-spacing--0_19, -0.192px);
  color: var(--Cornflower-Blue, var(--color-blue-68, #7c5cff));
}
.alert--ok {
  color: #16a34a;
}
.alert--err {
  color: #e53935;
}
.hint {
  color: var(--Topaz, var(--color-grey-49, #7a7388));
  font-size: 9.3px;
  font-weight: var(--font-weight-500, 500);
  line-height: var(--line-height-13_75, 13.75px);
  letter-spacing: var(--letter-spacing--0_19, -0.192px);
}
.error {
  font-size: 13px;
  color: #e53935;
  text-align: center;
  margin: 4px 0 0;
}
.primary {
  height: 54px;
  border-radius: 16px;
  background: #7c5cff;
  color: white;
  font-size: 16px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  margin-top: 4px;
  transition:
    opacity 0.15s,
    transform 0.08s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Pretendard;
}
.primary:active {
  transform: scale(0.98);
}
.primary:disabled {
  opacity: 0.6;
  cursor: default;
}
.footer {
  display: flex;
  padding: 12px;
  flex-direction: column;
  align-self: stretch;
}
</style>
