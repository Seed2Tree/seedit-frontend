<template>
  <div class="detail-page">
    <!-- 날짜 네비게이션 -->
    <div class="date-nav">
      <button class="nav-btn" @click="moveDate(-1)">&#8249;</button>
      <span class="date-label">{{ formattedDate }}</span>
      <button class="nav-btn" :disabled="currentDate >= todayStr" @click="moveDate(1)">
        &#8250;
      </button>
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
        <div v-for="trade in store.currentTrades" :key="trade.tid" class="trade-card">
          <div class="trade-card-header">
            <div :class="['stock-icon', trade.tradeType.toLowerCase()]">
              <img
                :src="logoUrl(trade.ticker)"
                class="stock-avatar"
                :alt="trade.companyName.slice(0, 2)"
                @error="(e) => onLogoError(e, trade.companyName)"
              />
            </div>
            <div class="trade-info">
              <span class="company-name">{{ trade.companyName }}</span>
              <span :class="['trade-badge', trade.tradeType.toLowerCase()]">
                {{ trade.tradeType === 'BUY' ? '매수' : '매도' }}
              </span>
            </div>
            <span class="trade-amount"
              >{{ trade.quantity }}주 · {{ formatAmount(trade.totalAmount) }}</span
            >
          </div>
          <div class="trade-card-body">
            <div class="trade-stat">
              <span class="stat-label">체결가</span>
              <span class="stat-value">{{ trade.tradePrice?.toLocaleString() }}원</span>
            </div>
            <div class="trade-stat">
              <span class="stat-label">{{
                trade.tradeType === 'BUY' ? '가설태그' : '매도이유'
              }}</span>
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
          :placeholder="
            isFuture
              ? '미래 날짜에는 일지를 작성할 수 없어요.'
              : '오늘 매수/매도 일지를 작성해보세요.'
          "
          :disabled="isFuture || isEditLocked"
          rows="6"
        />
        <button
          v-if="!isFuture"
          class="complete-btn"
          :disabled="isSaving || isEditLocked"
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
          <span class="ai-counter">{{ parsedFeedback ? '1/1' : '0/1' }}</span>
        </div>

        <!-- 피드백 결과 카드 -->
        <div v-if="parsedFeedback" class="ai-result-card">
          <div class="ai-score-row">
            <div class="ai-stars">
              <span
                v-for="i in 5"
                :key="i"
                class="star"
                :class="{ filled: i <= Math.round(parsedFeedback.score) }"
                >★</span
              >
            </div>
            <span class="ai-score-value">
              {{ parsedFeedback.score?.toFixed(1) }}<span class="score-max"> / 5.0</span>
            </span>
          </div>
          <div class="ai-item">
            <div class="ai-item-label good">✓ 잘한 점</div>
            <p class="ai-item-text">{{ parsedFeedback.good }}</p>
          </div>
          <div class="ai-item">
            <div class="ai-item-label improve">△ 생각해볼 점</div>
            <p class="ai-item-text">{{ parsedFeedback.improve }}</p>
          </div>
          <div class="ai-item">
            <div class="ai-item-label action">→ 다음 액션</div>
            <p class="ai-item-text">{{ parsedFeedback.action }}</p>
          </div>
        </div>
        <p v-if="parsedFeedback" class="ai-hint" align="center">
          AI가 생성한 내용은 사실과 다를 수 있어요.<br />투자 복기를 위한 참고용으로만 사용해주세요.
        </p>

        <!-- 미생성 상태 -->
        <div v-else class="ai-placeholder">
          <button
            class="ai-generate-btn"
            :disabled="!canGenerateFeedback || isGenerating"
            @click="onGenerateFeedback"
          >
            {{ isGenerating ? '생성 중...' : '✦ AI 피드백 생성하기' }}
          </button>
          <p class="ai-hint">
            오늘의 투자 내용을 바탕으로 AI 피드백을 받아보세요.<br />※ AI가 생성한 내용은 사실과
            다를 수 있어요.
          </p>
        </div>
      </div>
    </template>
  </div>

  <!-- 확인 모달 -->
  <Teleport to="body">
    <div v-if="showFeedbackModal" class="modal-overlay" @click.self="showFeedbackModal = false">
      <div class="modal-box">
        <p class="modal-text">
          AI 피드백은 날짜별 <strong>1회</strong>만 생성 가능해요.<br />지금 생성하시겠어요?
        </p>
        <div class="modal-actions">
          <button class="modal-cancel" @click="showFeedbackModal = false">취소</button>
          <button class="modal-confirm" @click="confirmGenerate">확인</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'

const route = useRoute()
const router = useRouter()
const store = useDiaryStore()

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
const isSaving = ref(false)
const isGenerating = ref(false)
const showFeedbackModal = ref(false)

const currentDate = computed(() => route.params.date)

const todayStr = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})()
const isFuture = computed(() => currentDate.value > todayStr) // 미래 날짜인지 여부
const isEditLocked = computed(
  () => !!parsedFeedback.value, // 피드백 있으면 수정 불가
)

const formattedDate = computed(() => {
  if (!currentDate.value) return ''
  const [y, m, d] = currentDate.value.split('-')
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const day = new Date(+y, +m - 1, +d).getDay()
  return `${y}년 ${+m}월 ${+d}일 (${dayNames[day]})`
})

function logoUrl(ticker) {
  return `https://file.alphasquare.co.kr/media/images/stock_logo/kr/${ticker}.png`
}

function onLogoError(e, companyName) {
  const initials = companyName.slice(0, 2)
  e.target.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' rx='12' fill='%23ede9ff'/><text x='50%25' y='50%25' font-family='sans-serif' font-size='13' font-weight='800' fill='%237c5cff' text-anchor='middle' dominant-baseline='central'>${initials}</text></svg>`
  e.target.onerror = null
}

// 상태 칩 활성화 여부
const hasBuy = computed(() => store.currentTrades.some((t) => t.tradeType === 'BUY'))
const hasSell = computed(() => store.currentTrades.some((t) => t.tradeType === 'SELL'))
const hasDiaryContent = computed(() => !!store.currentDiary?.content?.trim())

// AI 피드백 파싱
const parsedFeedback = computed(() => {
  if (!store.currentDiary?.aiFeedback) return null
  try {
    return JSON.parse(store.currentDiary.aiFeedback)
  } catch {
    return null
  }
})

// 피드백 생성 가능 여부 (거래 or 일지 내용 존재 + 미래 아님 + 미생성)
const canGenerateFeedback = computed(() => {
  if (isFuture.value) return false
  if (parsedFeedback.value) return false
  return store.currentTrades.length > 0 || !!store.currentDiary?.content?.trim()
})

// 날짜 이동
function moveDate(delta) {
  const d = new Date(currentDate.value)
  d.setDate(d.getDate() + delta)
  router.replace({ name: 'diary-detail', params: { date: toDateStr(d) } })
}

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

async function onSave() {
  isSaving.value = true
  try {
    await store.saveDiary(currentDate.value, diaryContent.value)
  } finally {
    isSaving.value = false
  }
}

function onGenerateFeedback() {
  showFeedbackModal.value = true
}

async function confirmGenerate() {
  showFeedbackModal.value = false
  isGenerating.value = true
  try {
    await store.generateFeedback(currentDate.value)
  } catch {
    alert('AI 피드백 생성에 실패했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    isGenerating.value = false
  }
}

function formatAmount(amount) {
  if (!amount) return ''
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`
  if (amount >= 10000) return `${Math.round(amount / 10000)}만원`
  return `${amount.toLocaleString()}원`
}

async function loadData(date) {
  await store.fetchDateDetail(date)
  diaryContent.value = store.currentDiary?.content ?? ''
}

watch(currentDate, (date) => {
  if (date) loadData(date)
})
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
.nav-btn {
  background: none;
  border: none;
  font-size: 22px;
  color: #555;
  cursor: pointer;
}
.nav-btn:disabled {
  color: #ddd;
  cursor: default;
}
.date-label {
  font-size: 15px;
  font-weight: 600;
  color: #111;
}

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
  border-color: #7c5cff;
  background: #ede9ff;
  color: #7c5cff;
  font-weight: 600;
}

/* 로딩 */
.state-box {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #eee;
  border-top-color: #7c5cff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 거래 카드 */
.trades-section {
  padding: 12px 16px 0;
}
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
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.stock-icon.buy {
  background: #e53935;
}
.stock-icon.sell {
  background: #1e6ef4;
}

.trade-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}
.company-name {
  font-size: 14px;
  font-weight: 600;
  color: #111;
}
.trade-badge {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 600;
}
.trade-badge.buy {
  background: #fdecea;
  color: #e53935;
}
.trade-badge.sell {
  background: #e8effe;
  color: #1e6ef4;
}
.trade-amount {
  font-size: 12px;
  color: #888;
  flex-shrink: 0;
}

.trade-card-body {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}
.trade-stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.stat-label {
  font-size: 11px;
  color: #aaa;
}
.stat-value {
  font-size: 13px;
  color: #222;
  font-weight: 500;
}
.stat-value.reason {
  color: #7c5cff;
}

/* 일지 영역 */
.diary-section {
  padding: 16px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #111;
  margin: 0 0 12px;
}

.stock-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #ede9ff;
  object-fit: contain;
  flex-shrink: 0;
}
.featured-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.25);
  object-fit: contain;
  flex-shrink: 0;
}

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
.diary-textarea:focus {
  border-color: #7c5cff;
}
.diary-textarea::placeholder {
  color: #bbb;
}

.complete-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 10px 0 0 auto;
  padding: 8px 20px;
  border: none;
  border-radius: 20px;
  background: #7c5cff;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.complete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* AI 피드백 */
.ai-section {
  padding: 0 16px 24px;
}
.ai-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}
.ai-label {
  font-size: 15px;
  font-weight: 600;
  color: #111;
}
.ai-badge {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #ede9ff;
  color: #7c5cff;
  font-weight: 700;
}
.ai-counter {
  font-size: 12px;
  color: #bbb;
  margin-left: auto;
}

/* 결과 카드 */
.ai-result-card {
  background: #f8f6ff;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ai-score-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 14px;
  border-bottom: 1px solid #ede9ff;
}
.ai-stars {
  display: flex;
  gap: 2px;
}
.star {
  font-size: 20px;
  color: #ddd;
}
.star.filled {
  color: #7c5cff;
}
.ai-score-value {
  font-size: 22px;
  font-weight: 700;
  color: #7c5cff;
  margin-left: auto;
}
.score-max {
  font-size: 13px;
  color: #bbb;
  font-weight: 400;
}

.ai-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ai-item-label {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}
.ai-item-label.good {
  background: #e6f7ee;
  color: #2e7d52;
}
.ai-item-label.improve {
  background: #fff8e1;
  color: #b77a00;
}
.ai-item-label.action {
  background: #e8effe;
  color: #1e6ef4;
}
.ai-item-text {
  font-size: 13px;
  color: #333;
  line-height: 1.6;
  margin: 0;
  padding: 0 2px;
}

/* 미생성 상태 */
.ai-placeholder {
  text-align: center;
}
.ai-generate-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: #7c5cff;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.ai-generate-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.ai-hint {
  font-size: 12px;
  color: #aaa;
  margin-top: 8px;
  line-height: 1.6;
}

/* 모달 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-box {
  background: #fff;
  border-radius: 16px;
  padding: 24px 20px 20px;
  width: 280px;
  text-align: center;
}
.modal-text {
  font-size: 14px;
  color: #222;
  line-height: 1.7;
  margin: 0 0 20px;
}
.modal-actions {
  display: flex;
  gap: 10px;
}
.modal-cancel {
  flex: 1;
  padding: 11px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background: #fff;
  color: #888;
  font-size: 14px;
  cursor: pointer;
}
.modal-confirm {
  flex: 1;
  padding: 11px;
  border: none;
  border-radius: 10px;
  background: #7c5cff;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>
