<template>
  <div class="onboarding" :style="{ background: current.bg }">
    <!-- 건너뛰기 -->
    <header class="ob-header">
      <button type="button" class="skip" @click="finish">건너뛰기</button>
    </header>

    <!-- 슬라이드 본문 -->
    <main class="ob-body">
      <div class="emoji">{{ current.emoji }}</div>
      <h1 class="ob-title" v-html="current.title" />
      <p class="ob-desc" v-html="current.desc" />
    </main>

    <!-- 인디케이터 + 버튼 -->
    <footer class="ob-footer">
      <div class="dots">
        <span v-for="(s, i) in slides" :key="i" class="dot" :class="{ active: i === step }" />
      </div>
      <button type="button" class="primary" @click="next">
        {{ isLast ? '시작하기' : '다음' }}
      </button>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const slides = [
  {
    emoji: '🌰',
    title: '모의투자로<br />먼저 연습해요',
    desc: '실제 돈 없이도 진짜처럼.<br />매수·매도 결정을 부담 없이 시도해봐요.',
    bg: '#F2EEFF',
  },
  {
    emoji: '🌱',
    title: '왜 샀는지<br />꼭 기록해요',
    desc: '감정과 이유를 함께 남기면<br />다음 결정이 더 똑똑해져요.',
    bg: '#ECE6FF',
  },
  {
    emoji: '🪴',
    title: '씨앗을 새싹으로<br />키워봐요',
    desc: '꾸준한 기록과 학습으로<br />내 씨앗이 무럭무럭 자라요.',
    bg: '#E3DAFF',
  },
]

const step = ref(0)
const current = computed(() => slides[step.value])
const isLast = computed(() => step.value === slides.length - 1)

function next() {
  if (isLast.value) finish()
  else step.value += 1
}

function finish() {
  // 온보딩 재노출 방지 플래그(선택)
  localStorage.setItem('onboarded', 'true')
  router.replace({ name: 'login' })
}
</script>

<style scoped>
.onboarding {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: background 0.3s ease;
}

/* 건너뛰기 */
.ob-header {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
}
.skip {
  background: none;
  border: none;
  color: var(--color-violet-31, #4a4459);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: 'Pretendard';
}

/* 본문 */
.ob-body {
  flex: 1 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 14px;
  padding: 0 24px;
}
.emoji {
  font-size: 80px;
  margin-bottom: 12px;
}
.ob-title {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: -0.03em;
  color: var(--color-blue-14, #1e1a2e);
}
.ob-desc {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
  color: var(--color-violet-31, #4a4459);
}

/* 푸터 */
.ob-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 12px 12px 24px;
}
.dots {
  display: flex;
  gap: 8px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(124, 92, 255, 0.25);
  transition: all 0.25s ease;
}
.dot.active {
  width: 22px;
  border-radius: 4px;
  background: #7c5cff;
}
.primary {
  width: 100%;
  height: 54px;
  border-radius: 16px;
  background: #7c5cff;
  color: white;
  font-size: 16px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  font-family: 'Pretendard';
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    opacity 0.15s,
    transform 0.08s;
}
.primary:active {
  transform: scale(0.98);
}
</style>
