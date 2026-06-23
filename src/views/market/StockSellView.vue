<template>
  <div class="sellview">
    <BaseToast ref="toast" />
    <div class="container">
      <!-- 종목 소개 -->
      <div class="intro">
        <div class="company-img">{{ companyInitial }}</div>
        <div class="company-container">
          <div class="company-title">{{ company.name }}</div>
          <div class="company-desc">
            보유 {{ currentQuantity }}주 · 평단 {{ formatNumber(avgPrice) }}원
          </div>
        </div>
        <div class="company-price">{{ formatNumber(currentPrice) }}원</div>
      </div>

      <!-- 현재가 / 평단가 / 보유 수량 -->
      <div class="info-card">
        <div class="info-row">
          <span class="info-key">현재가</span>
          <span class="info-val">{{ formatNumber(currentPrice) }}원</span>
        </div>
        <div class="info-row">
          <span class="info-key">평단가</span>
          <span class="info-val">{{ formatNumber(avgPrice) }}원</span>
        </div>
        <div class="info-row">
          <span class="info-key">보유 수량</span>
          <span class="info-val">{{ currentQuantity }}주</span>
        </div>
      </div>

      <!-- 매도 수량 -->
      <div class="quantity-info">
        <div class="title">매도 수량</div>
        <div class="stepper">
          <button class="step-btn" :disabled="quantity <= 1" @click="decrease">−</button>
          <div class="number-box">
            <span class="number">{{ quantity }}</span>
            <span class="unit">주</span>
          </div>
          <button class="step-btn" :disabled="quantity >= maxShares" @click="increase">+</button>
        </div>
        <div class="btn-container">
          <button
            v-for="opt in quickOptions"
            :key="opt.label"
            :class="['quick-btn', { active: isQuickActive(opt) }]"
            @click="setQuantity(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- 총 매도금액 / 예상 수익 / 수익률 -->
      <div class="total-card">
        <div class="total-row">
          <span class="total-key">총 매도금액</span>
          <span class="total-amount">{{ formatNumber(totalAmount) }}원</span>
        </div>
        <div class="total-row">
          <span class="total-key">예상 수익</span>
          <span :class="['total-remain', profitClass]">{{ formatSigned(expectedProfit) }}원</span>
        </div>
        <div class="total-row">
          <span class="total-key">수익률</span>
          <span :class="['total-remain', profitClass]">{{ formatRate(profitRate) }}</span>
        </div>
      </div>

      <div class="origin-reason">
        <div class="reason-title">처음 살 때 이유는</div>
        <template v-if="buyReasons.length">
          <div v-for="(r, i) in buyReasons" :key="i" class="origin-card">
            <div class="origin-badge">
              <span class="tag-emoji">{{ r.emoji }}</span>
              {{ r.label }}
              <span v-if="r.date"> · {{ r.date }}</span>
            </div>
            <p class="origin-text">"{{ r.text }}"</p>
          </div>
        </template>
        <div v-else class="origin-empty">기록된 매수 이유가 없어요.</div>
      </div>

      <!-- 매도 사유 (F05 투자 복기) -->
      <div class="sell-reason">
        <div class="reason-title">왜 파는 거예요?</div>
        <div class="reason-desc">파는 이유를 남겨두면, 다음 투자에 도움이 돼요.</div>

        <div class="tag-container">
          <button
            v-for="tag in sellReasonTags"
            :key="tag.value"
            :class="['tag', { active: selectedTag === tag.value }]"
            @click="selectedTag = tag.value"
          >
            <span class="tag-emoji">{{ tag.emoji }}</span
            >{{ tag.label }}
          </button>
        </div>

        <textarea
          v-model="reasonText"
          class="reason-input"
          rows="3"
          placeholder="예) 목표가 80,000원까지는 안 갔지만 +4% 익절, 욕심부리지 않기로 했다."
        />
      </div>
    </div>

    <footer class="footer">
      <button class="back" @click="onCancel">취소</button>
      <button class="sell-btn" :disabled="!canSubmit" @click="onSubmit">
        {{ quantity }}주 매도하기
      </button>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { tradesApi } from '@/api/trades'
import BaseToast from '@/components/BaseToast.vue'

const router = useRouter()
const route = useRoute()
const ticker = route.params.ticker
const toast = ref(null)

// --- 상태 ---
const company = ref({ name: '', ticker: '', market: '', sector: '' })
const currentPrice = ref(0)
const avgPrice = ref(0) // 평단가
const currentQuantity = ref(0) // 보유 수량
const quantity = ref(1) // 매도 수량
const selectedTag = ref('')
const reasonText = ref('')
const originalReasons = ref([]) // 처음 살 때 이유 (매수 가설)

// 매도 사유 태그 (F05 복기)
const sellReasonTags = [
  { value: 'target', label: '목표가 도달', emoji: '🎯' },
  { value: 'stoploss', label: '손절', emoji: '✂️' },
  { value: 'bad-news', label: '악재', emoji: '📉' },
  { value: 'switch', label: '다른 종목으로', emoji: '🔄' },
]
// 출력: 코드 → 한글 변환 맵
const tagLabel = {
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
// 매수 가설 카테고리 → 표시용 라벨/이모지 (원래 이유 렌더링에 사용)
// 태그가 한글 라벨로 오니까 라벨 기준 이모지 맵
const tagEmoji = {
  '실적 기대': '📈',
  '호재 뉴스': '📰',
  '장기 투자': '🌱',
  '단기 반등': '⚡',
  '차트 패턴': '📊',
  기타: '✏️',
}
// 매수 가설만 추려서 화면용으로 변환
const buyReasons = computed(() =>
  originalReasons.value
    .filter((r) => r.reasonType === 'BUY')
    .map((r) => ({
      label: tagLabel[r.reasonTag] ?? r.reasonTag,
      emoji: tagEmoji[r.reasonTag] ?? '✏️',
      date: formatDate(r.reasonDate),
      text: r.reasonText,
    })),
)

// --- 계산값 ---
const companyInitial = computed(() => company.value.name?.charAt(0) ?? '')
const maxShares = computed(() => currentQuantity.value) // 보유 수량까지만 매도 가능
const totalAmount = computed(() => quantity.value * currentPrice.value)
const expectedProfit = computed(() => quantity.value * (currentPrice.value - avgPrice.value))
const profitRate = computed(() =>
  avgPrice.value > 0 ? ((currentPrice.value - avgPrice.value) / avgPrice.value) * 100 : 0,
)
// 수익 빨강 / 손실 파랑 (한국식)
const profitClass = computed(() => (expectedProfit.value >= 0 ? 'gain' : 'loss'))
const canSubmit = computed(() => quantity.value > 0 && quantity.value <= currentQuantity.value)

const quickOptions = computed(() => [
  { label: '1주', value: 1 },
  { label: '10주', value: 10 },
  { label: '20주', value: 20 },
  { label: '최대', value: maxShares.value, isMax: true },
])

function isQuickActive(opt) {
  return quantity.value === opt.value
}

// --- 액션 ---
function setQuantity(v) {
  quantity.value = Math.min(Math.max(1, v), maxShares.value || 1)
}
function increase() {
  if (quantity.value < maxShares.value) quantity.value++
}
function decrease() {
  if (quantity.value > 1) quantity.value--
}

function formatNumber(n) {
  if (n == null) return '-'
  return Number(n).toLocaleString('ko-KR')
}
// 부호 붙은 금액 (+14,500 / −3,200)
function formatSigned(n) {
  if (n == null) return '-'
  const sign = n >= 0 ? '+' : '−'
  return `${sign}${Math.abs(n).toLocaleString('ko-KR')}`
}
function formatRate(rate) {
  if (rate == null) return '-'
  const sign = rate >= 0 ? '+' : '−'
  return `${sign}${Math.abs(rate).toFixed(2)}%`
}

function onCancel() {
  router.back()
}

async function onSubmit() {
  if (!canSubmit.value) return
  if (!selectedTag.value) return toast.value.show('최소 1개 이상의 매도 태그를 선택해주세요.')

  try {
    const payload = {
      ticker: ticker,
      quantity: quantity.value,
      tradeType: 'SELL',
      reasonTag: selectedTag.value || null,
      reasonText: reasonText.value || null,
    }

    await tradesApi.sellStock(payload)

    router.replace({ name: 'portfolio-detail', params: { ticker } })
  } catch (e) {
    toast.value.show(e.response?.data?.message || '매수에 실패했어요. 잠시 후 다시 시도해주세요.')
  }
}

// --- 데이터 로드 ---
onMounted(async () => {
  // 1) 종목 현재가
  try {
    const res = await tradesApi.getSellStock(ticker)
    const s = res.data
    if (s) {
      company.value = {
        name: s.stock.companyName,
        ticker: s.stock.ticker,
        market: s.stock.market,
        sector: s.stock.sector,
      }
      currentPrice.value = s.stock.currentPrice
      avgPrice.value = s.portfolio.avgPrice
      currentQuantity.value = s.portfolio.quantity
      quantity.value = s.portfolio.quantity || 1
      originalReasons.value = s.reasons ?? []
    }
  } catch (e) {
    // 종목 로드 실패
    alert('보유하신 종목이 아닙니다. 다시 시도해주세요.')
    router.replcae({ name: 'stock-detail', params: { ticker } })
  }
})

function formatDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}
</script>

<style scoped>
.sellview {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #fff;
}

.container {
  flex: 1 0 0;
  padding: 8px 20px 24px;
}

/* 종목 소개 */
.intro {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0 20px;
}
.company-img {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #f2eeff;
  color: #7c5cff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 800;
  flex-shrink: 0;
}
.company-container {
  flex: 1 0 0;
}
.company-title {
  font-size: 16px;
  font-weight: 800;
  color: #1e1a2e;
}
.company-desc {
  font-size: 12px;
  font-weight: 600;
  color: #a8a2b5;
  margin-top: 2px;
}
.company-price {
  font-size: 18px;
  font-weight: 800;
  color: #1e1a2e;
  font-variant-numeric: tabular-nums;
}

/* 정보 카드 */
.info-card {
  background: #fbfafd;
  border: 1px solid #efedf4;
  border-radius: 16px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.info-key {
  font-size: 14px;
  font-weight: 600;
  color: #7a7388;
}
.info-val {
  font-size: 15px;
  font-weight: 700;
  color: #1e1a2e;
  font-variant-numeric: tabular-nums;
}

/* 수량 */
.quantity-info {
  margin-top: 28px;
}
.title {
  font-size: 15px;
  font-weight: 700;
  color: #1e1a2e;
  margin-bottom: 12px;
}
.stepper {
  display: flex;
  align-items: center;
  gap: 12px;
}
.step-btn {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  border: 1px solid #e4e2ed;
  background: #fff;
  font-size: 24px;
  font-weight: 500;
  color: #1e1a2e;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s;
}
.step-btn:active:not(:disabled) {
  background: #f7f6fb;
}
.step-btn:disabled {
  color: #d3d0dc;
  cursor: not-allowed;
}
.number-box {
  flex: 1 0 0;
  height: 48px;
  border-radius: 14px;
  border: 1.5px solid #7c5cff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.number {
  font-size: 18px;
  font-weight: 800;
  color: #1e1a2e;
  font-variant-numeric: tabular-nums;
}
.unit {
  font-size: 14px;
  font-weight: 600;
  color: #7a7388;
}

.btn-container {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.quick-btn {
  flex: 1 0 0;
  height: 38px;
  border-radius: 10px;
  border: 1px solid #e4e2ed;
  background: #fff;
  font-size: 13px;
  font-weight: 700;
  color: #4a4459;
  cursor: pointer;
  transition: all 0.12s;
}
.quick-btn.active {
  background: #f2eeff;
  border-color: #7c5cff;
  color: #7c5cff;
}

/* 합계 카드 */
.total-card {
  margin-top: 28px;
  background: #fbfafd;
  border: 1px solid #efedf4;
  border-radius: 16px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.total-key {
  font-size: 14px;
  font-weight: 600;
  color: #7a7388;
}
.total-amount {
  font-size: 18px;
  font-weight: 800;
  color: #1e1a2e;
  font-variant-numeric: tabular-nums;
}
.total-remain {
  font-size: 15px;
  font-weight: 700;
  color: #1e1a2e;
  font-variant-numeric: tabular-nums;
}
.total-remain.gain {
  color: #e53935;
}
.total-remain.loss {
  color: #1e6ef4;
}

/* 처음 살 때 이유 (읽기 전용) */
.origin-reason {
  margin-top: 32px;
}
.origin-card {
  margin-top: 12px;
  background: #fbfafd;
  border: 1px solid #efedf4;
  border-radius: 14px;
  padding: 14px 16px;
}
.origin-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  color: #7a7388;
}
.origin-text {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: #4a4459;
}
.origin-empty {
  margin-top: 12px;
  font-size: 13px;
  color: #a8a2b5;
}

/* 매도 사유 */
.sell-reason {
  margin-top: 28px;
}
.reason-title {
  font-size: 17px;
  font-weight: 800;
  color: #1e1a2e;
}
.reason-desc {
  font-size: 13px;
  font-weight: 500;
  color: #a8a2b5;
  margin-top: 6px;
}
.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
.tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 9px 14px;
  border-radius: 9999px;
  border: 1px solid #e4e2ed;
  background: #fff;
  font-size: 13px;
  font-weight: 700;
  color: #4a4459;
  cursor: pointer;
  transition: all 0.12s;
}
.tag.active {
  background: #f2eeff;
  border-color: #7c5cff;
  color: #7c5cff;
}
.tag-emoji {
  font-size: 14px;
}

.reason-input {
  width: 100%;
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid #e4e2ed;
  background: #fbfafd;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: #1e1a2e;
  resize: none;
  box-sizing: border-box;
}
.reason-input:focus {
  outline: none;
  border-color: #7c5cff;
  background: #fff;
}
.reason-input::placeholder {
  color: #b5b0c2;
}

/* 푸터 */
.footer {
  position: sticky;
  bottom: 0;
  display: flex;
  gap: 8px;
  padding: 12px 20px 24px;
  background: #fff;
  border-top: 1px solid #f3f1f8;
}
.back {
  width: 100px;
  height: 54px;
  border-radius: 16px;
  border: 1px solid #e4e2ed;
  background: #fff;
  font-size: 16px;
  font-weight: 700;
  color: #4a4459;
  cursor: pointer;
}
.sell-btn {
  flex: 1 0 0;
  height: 54px;
  border-radius: 16px;
  border: none;
  background: #5b74f2; /* 매도 = 파랑 (StockDetailView btn-sell과 동일) */
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.12s;
}
.sell-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
