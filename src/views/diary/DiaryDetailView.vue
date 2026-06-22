<template>
  <div class="detail-page">

    <!-- 날짜 네비게이션 -->
    <div class="date-nav">
      <button class="nav-btn" @click="moveDate(-1)">&#8249;</button>
      <span class="date-label">{{ formattedDate }}</span>
      <button class="nav-btn" :disabled="currentDate >= todayStr" @click="moveDate(1)">&#8250;</button>
    </div>

    <!-- 상태 칩 (표시용, 클릭 불가) -->
    <div class="status-chips">
      <span :class="['chip', { active: hasBuy }]">매수</span>
      <span :class="['chip', { active: hasSell }]">매도</span>
      <span :class="['chip', { active: hasDiaryContent }]">일지</span>
    </div>

    <!-- 로딩 -->
    <div v-if="store.isLoading" class="state-box">
      <div class="spinner" />
    </div>

    <template v-else>

      <!-- 거래내역 카드들 (매수 + 매도 한번에) -->
      <div v-if="store.currentTrades.length > 0" class="trades-section">
        <div
          v-for="trade in store.currentTrades"
          :key="trade.tid"
          class="trade-card"
        >
          <div class="trade-card-header">
            <div :class="['stock-icon', trade.tradeType.toLowerCase()]">
              {{ trade.companyName?.[0] }}
            </div>
            <div class="trade-info">
              <span class="company-name">{{ trade.companyName }}</span>
              <span :class="['trade-badge', trade.tradeType.toLowerCase()]">
                {{ trade.tradeType === 'BUY' ? '매수' : '매도' }}
              </span>
            </div>
            <span class="trade-amount">{{ trade.quantity }}주 · {{ formatAmount(trade.totalAmount) }}</span>
          </div>
          <div class="trade-card-body">
            <div class="trade-stat">
              <span class="stat-label">체결가</span>
              <span class="stat-value">{{ trade.tradePrice?.toLocaleString() }}원</span>
            </div>
            <div class="trade-stat">
              <span class="stat-label">{{ trade.tradeType === 'BUY' ? '가설태그' : '매도이유' }}</span>
              <span class="stat-value reason">{{ reasonTagLabel(trade.reasonTag) }}</span>
            </div>
            <div class="trade-stat">
              <span class="stat-label">상세</span>
              <span class="stat-value reason">{{ trade.reasonText ?? '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 일지 작성 영역 -->
      <div class="diary-section">
        <h3 class="section-title">오늘의 일지</h3>
        <textarea
          v-model="diaryContent"
          class="diary-textarea"
          :placeholder="isFuture ? '미래 날짜에는 일지를 작성할 수 없어요.' : '오늘 매수/매도 일지를 작성해보세요.'"
          :disabled="isFuture"
          rows="6"
        />
        <button
          v-if="!isFuture"
          class="complete-btn"
          :disabled="isSaving"
          @click="onSave"
        >
          {{ isSaving ? '저장 중...' : '✏ 완료' }}
        </button>
      </div>

      <!-- AI 피드백 섹션 -->
      <div class="ai-section">
        <div class="ai-header">
          <span class="ai-label">AI 피드백</span>
          <span class="ai-badge">BETA</span>
        </div>

        <div v-if="store.currentDiary?.aiFeedback" class="ai-card">
          <p class="ai-feedback-text">{{ store.currentDiary.aiFeedback }}</p>
        </div>

        <div v-else class="ai-placeholder">
          <button class="ai-generate-btn" disabled>
            ✦ AI 피드백 생성하기
          </button>
          <p class="ai-hint">오늘의 투자 내용을 바탕으로 AI 피드백을 받아보세요.<br>※ AI가 생성한 내용은 사실과 다를 수 있어요.</p>
        </div>
      </div>

    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'

const route  = useRoute()
const router = useRouter()
const store  = useDiaryStore()

const REASON_TAG_LABELS = {
  earnings: '실적 기대',
  news: '호재 뉴스',
  long: '장기 투자',
  rebound: '단기 반등',
  chart: '차트 패턴',
  etc: '기타',
  target: '목표가 도달',
  stoploss: '손절',
  'bad-news': '악재',
  switch: '다른 종목으로',
}
function reasonTagLabel(tag) {
  if (!tag) return '-'
  return REASON_TAG_LABELS[tag] ?? tag
}

const diaryContent = ref('')
const isSaving     = ref(false)

const currentDate = computed(() => route.params.date)

const todayStr = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
})()
const isFuture = computed(() => currentDate.value > todayStr)

const formattedDate = computed(() => {
  if (!currentDate.value) return ''
  const [y, m, d] = currentDate.value.split('-')
  const dayNames = ['일','월','화','수','목','금','토']
  const day = new Date(+y, +m - 1, +d).getDay()
  return `${y}년 ${+m}월 ${+d}일 (${dayNames[day]})`
})

// 상태 칩 활성화 여부
const hasBuy          = computed(() => store.currentTrades.some((t) => t.tradeType === 'BUY'))
const hasSell         = computed(() => store.currentTrades.some((t) => t.tradeType === 'SELL'))
const hasDiaryContent = computed(() => !!store.currentDiary?.content?.trim())

// 날짜 이동
function moveDate(delta) {
  const d = new Date(currentDate.value)
  d.setDate(d.getDate() + delta)
  router.replace({ name: 'diary-detail', params: { date: toDateStr(d) } })
}

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

async function onSave() {
  isSaving.value = true
  try {
    await store.saveDiary(currentDate.value, diaryContent.value)
  } finally {
    isSaving.value = false
  }
}

function formatAmount(amount) {
  if (!amount) return ''
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`
  if (amount >= 10000)     return `${Math.round(amount / 10000)}만원`
  return `${amount.toLocaleString()}원`
}

async function loadData(date) {
  await store.fetchDateDetail(date)
  diaryContent.value = store.currentDiary?.content ?? ''
}

watch(currentDate, (date) => { if (date) loadData(date) })
onMounted(() => loadData(currentDate.value))
</script>

<style scoped>
.detail-page {
  padding: 0 0 80px;
  background: #fff;
  min-height: 100vh;
}

/* 날짜 네비게이션 */
.date-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}
.nav-btn { background: none; border: none; font-size: 22px; color: #555; cursor: pointer; }
.nav-btn:disabled { color: #ddd; cursor: default; }
.date-label { font-size: 15px; font-weight: 600; color: #111; }

/* 상태 칩 */
.status-chips {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}
.chip {
  padding: 5px 16px;
  border-radius: 20px;
  border: 1px solid #ddd;
  background: #fff;
  font-size: 13px;
  color: #bbb;
  cursor: default;
  user-select: none;
}
.chip.active {
  border-color: #7C5CFF;
  background: #ede9ff;
  color: #7C5CFF;
  font-weight: 600;
}

/* 로딩 */
.state-box { display: flex; justify-content: center; padding: 48px 0; }
.spinner {
  width: 28px; height: 28px;
  border: 3px solid #eee; border-top-color: #7C5CFF;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 거래 카드 */
.trades-section { padding: 12px 16px 0; }
.trade-card {
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
}
.trade-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.stock-icon {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #fff; flex-shrink: 0;
}
.stock-icon.buy  { background: #E53935; }
.stock-icon.sell { background: #1E6EF4; }

.trade-info { flex: 1; display: flex; align-items: center; gap: 6px; }
.company-name { font-size: 14px; font-weight: 600; color: #111; }
.trade-badge { font-size: 10px; padding: 2px 7px; border-radius: 4px; font-weight: 600; }
.trade-badge.buy  { background: #fdecea; color: #E53935; }
.trade-badge.sell { background: #e8effe; color: #1E6EF4; }
.trade-amount { font-size: 12px; color: #888; flex-shrink: 0; }

.trade-card-body {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}
.trade-stat { display: flex; flex-direction: column; gap: 3px; }
.stat-label { font-size: 11px; color: #aaa; }
.stat-value { font-size: 13px; color: #222; font-weight: 500; }
.stat-value.reason { color: #7C5CFF; }

/* 일지 영역 */
.diary-section { padding: 16px; }
.section-title { font-size: 15px; font-weight: 600; color: #111; margin: 0 0 12px; }

.diary-textarea {
  width: 100%;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 14px;
  font-size: 14px;
  color: #222;
  line-height: 1.6;
  resize: none;
  box-sizing: border-box;
  outline: none;
  font-family: inherit;
}
.diary-textarea:focus { border-color: #7C5CFF; }
.diary-textarea::placeholder { color: #bbb; }

.complete-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 10px 0 0 auto;
  padding: 8px 20px;
  border: none;
  border-radius: 20px;
  background: #7C5CFF;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.complete-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* AI 피드백 */
.ai-section { padding: 0 16px 16px; }
.ai-header { display: flex; align-items: center; gap: 6px; margin-bottom: 12px; }
.ai-label { font-size: 15px; font-weight: 600; color: #111; }
.ai-badge {
  font-size: 9px; padding: 2px 6px; border-radius: 4px;
  background: #ede9ff; color: #7C5CFF; font-weight: 700;
}

.ai-card {
  background: #f8f6ff;
  border-radius: 12px;
  padding: 16px;
}
.ai-feedback-text { font-size: 14px; color: #333; line-height: 1.6; margin: 0; }

.ai-placeholder { text-align: center; }
.ai-generate-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: #7C5CFF;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: not-allowed;
  opacity: 0.5;
}
.ai-hint { font-size: 12px; color: #aaa; margin-top: 8px; }
</style>
