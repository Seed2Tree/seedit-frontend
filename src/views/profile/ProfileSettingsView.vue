<template>
  <div class="page">
    <div class="content">
      <!-- 아바타 -->
      <div class="avatar-section">
        <div class="avatar-wrap">
          <div class="avatar">
            <img v-if="form.avatarUrl" :src="form.avatarUrl" class="avatar-img" alt="" />
            <Sprout v-else :size="40" color="white" />
          </div>
        </div>
      </div>

      <form class="form" @submit.prevent="onSave">
        <!-- 닉네임 (수정 가능) -->
        <div class="field">
          <label class="label">닉네임</label>
          <input
            v-model="form.username"
            class="input"
            type="text"
            placeholder="사용하실 닉네임을 입력해주세요."
            maxlength="20"
          />
          <span class="hint">앱 안에서 보이는 이름이에요. 언제든 바꿀 수 있어요.</span>
        </div>

        <!-- 생년월일 (수정 가능) -->
        <div class="field">
          <label class="label">생년월일</label>
          <span class="birth-field">
            <input
              v-model="birthY"
              @input="birthY = birthY.replace(/\D/g, '')"
              class="Birthinput"
              inputmode="numeric"
              placeholder="2000"
              maxlength="4"
            />
            <input
              v-model="birthM"
              @input="birthM = birthM.replace(/\D/g, '')"
              class="Birthinput"
              inputmode="numeric"
              placeholder="02"
              maxlength="2"
            />
            <input
              v-model="birthD"
              @input="birthD = birthD.replace(/\D/g, '')"
              class="Birthinput"
              inputmode="numeric"
              placeholder="02"
              maxlength="2"
            />
          </span>
          <span v-if="birthFilled && !birthValid" class="field-error">
            올바른 생년월일이 아니에요. 다시 확인해주세요.
          </span>
        </div>

        <!-- 이름 (읽기 전용) -->
        <div class="field">
          <label class="label">이름</label>
          <input :value="form.name" class="input input--readonly" type="text" disabled />
          <span class="hint">이름은 변경할 수 없어요.</span>
        </div>

        <!-- 이메일 (읽기 전용) -->
        <div class="field">
          <label class="label">이메일</label>
          <input :value="form.email" class="input input--readonly" type="email" disabled />
          <span class="hint">이메일은 변경할 수 없어요.</span>
        </div>

        <!-- 부가 정보 (읽기 전용) -->
        <h3 v-if="info" class="section-label">내 정보</h3>
        <section v-if="info" class="info-card">
          <div class="info-row">
            <span class="info-key">레벨</span>
            <span class="info-val">Lv.{{ info.level.level }} · {{ info.level.levelName }}</span>
          </div>
          <div class="info-row">
            <span class="info-key">보유 잔고</span>
            <span class="info-val">{{ won(info.balance) }}원</span>
          </div>
          <div class="info-row">
            <span class="info-key">총 투자금</span>
            <span class="info-val">{{ won(info.totalInvested) }}원</span>
          </div>
          <div class="info-row">
            <span class="info-key">작성 일지</span>
            <span class="info-val">{{ info.activity.diaryCount }}편</span>
          </div>
          <div class="info-row">
            <span class="info-key">누적 거래</span>
            <span class="info-val">{{ info.activity.transactionCount }}회</span>
          </div>
          <div class="info-row">
            <span class="info-key">관심 종목</span>
            <span class="info-val">{{ info.activity.watchlistCount }}개</span>
          </div>
          <div class="info-row">
            <span class="info-key">스터디 북마크</span>
            <span class="info-val">{{ info.activity.studyBookmarkCount }}개</span>
          </div>
          <div class="info-row">
            <span class="info-key">가입일</span>
            <span class="info-val">{{ info.createdAt?.slice(0, 10) }}</span>
          </div>
        </section>

        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>

    <footer class="footer">
      <button class="primary" :disabled="saving || !canSave" @click="onSave">
        <span v-if="saving" class="spinner" />
        <span v-else>저장</span>
      </button>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Sprout } from 'lucide-vue-next'
import { userApi } from '@/api/user'

const router = useRouter()
const saving = ref(false)
const error = ref('')

const form = reactive({ username: '', name: '', email: '', avatarUrl: '' })
const birthY = ref('')
const birthM = ref('')
const birthD = ref('')
const info = ref(null) // 읽기 전용 부가 정보
const original = ref({ username: '', birth: '' })

onMounted(async () => {
  try {
    const res = await userApi.getMe()
    const u = res.data // { username, name, email, birth, level, balance, activity, ... }

    form.username = u.username
    form.name = u.name
    form.email = u.email

    // "2000-02-02" → 연/월/일 분리해서 폼에 미리 채움
    if (u.birth) {
      const [y, m, d] = u.birth.split('-')
      birthY.value = y
      birthM.value = m
      birthD.value = d
    }

    info.value = {
      level: u.level,
      balance: u.balance,
      totalInvested: u.totalInvested,
      activity: u.activity,
      createdAt: u.createdAt,
    }

    original.value = { username: u.username, birth: u.birth ?? '' }
  } catch (e) {
    error.value = '프로필을 불러오지 못했어요.'
  }
})

const pad2 = (v) => String(v).padStart(2, '0')

// 세 칸이 다 채워졌는지
const birthFilled = computed(
  () => /^\d{4}$/.test(birthY.value) && birthM.value !== '' && birthD.value !== '',
)

// 실제 존재하는 날짜인지 (2월 30일, 미래 날짜 등 차단)
const birthValid = computed(() => {
  if (!birthFilled.value) return false
  const y = Number(birthY.value)
  const m = Number(birthM.value)
  const d = Number(birthD.value)
  if (m < 1 || m > 12 || d < 1 || d > 31) return false
  const dt = new Date(y, m - 1, d)
  const real = dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
  if (!real) return false // 존재하지 않는 날짜
  if (dt > new Date()) return false // 미래 날짜
  if (y < 1900) return false // 비현실적 연도
  return true
})

// 저장용 "YYYY-MM-DD"
const birthStr = computed(() =>
  birthFilled.value ? `${birthY.value}.${pad2(birthM.value)}.${pad2(birthD.value)}` : '',
)

// 닉네임 비어있지 않고, 날짜 유효하고, 실제로 뭔가 바뀌었을 때만 저장 활성화
const canSave = computed(() => {
  if (form.username.trim() === '') return false
  if (!birthValid.value) return false
  return form.username !== original.value.username || birthStr.value !== original.value.birth
})

function won(n) {
  return Number(n ?? 0).toLocaleString('ko-KR')
}

async function onSave() {
  if (!canSave.value || saving.value) return
  saving.value = true
  error.value = ''
  try {
    const payload = { username: form.username, birth: birthStr.value }
    const res = await userApi.updateprofile(payload)

    if (res?.success === false) {
      error.value = res.error?.message || '저장에 실패했어요.'
      return
    }
    router.back()
  } catch (e) {
    error.value = e.response?.data?.error?.message || '저장에 실패했어요.'
  } finally {
    saving.value = false
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
  flex: 1;
  overflow-y: auto;
  padding: 8px 24px 24px;
}
.avatar-section {
  display: flex;
  justify-content: center;
  margin: 12px 0 28px;
}
.avatar-wrap {
  position: relative;
}
.avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
.input {
  width: 100%;
  box-sizing: border-box;
  height: 54px;
  border-radius: 14px;
  border: 1.5px solid #e4e2ed;
  background: #fff;
  padding: 0 16px;
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
.input--readonly {
  background: #f5f4f8;
  color: #9a97ae;
}
.hint {
  font-size: 11px;
  color: #9a97ae;
}
.field-error {
  font-size: 11px;
  color: #e53935;
}
.error {
  font-size: 13px;
  color: #e53935;
  text-align: center;
  margin: 4px 0 0;
}
.section-label {
  margin: 10px 0 -6px;
  font-size: 14px;
  font-weight: 800;
}
.info-card {
  border: 1px solid #f0edf7;
  border-radius: 16px;
  padding: 0 16px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 13px 0;
  border-bottom: 1px solid #f3f1f8;
}
.info-row:last-child {
  border-bottom: none;
}
.info-key {
  font-size: 13px;
  color: #7a7388;
}
.info-val {
  font-size: 14px;
  font-weight: 600;
  color: #1e1a2e;
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
.birth-field {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.Birthinput {
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
  width: 100%;
  box-sizing: border-box;
}
.Birthinput:focus {
  border-color: #7c5cff;
}
</style>
