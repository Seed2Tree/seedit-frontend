<template>
  <div class="buyview">
    <BaseToast ref="toast" />
    <div class="container">
      <!-- 종목 소개 -->
      <div class="intro">
        <div :class="['stock-icon']">
          <img
            :src="logoUrl(ticker)"
            class="stock-avatar"
            :alt="company?.name?.slice(0, 2)"
            @error="(e) => onLogoError(e, company?.name)"
          />
        </div>
        <!-- <div class="company-img">{{ companyInitial }}</div> -->
        <div class="company-container">
          <div class="company-title">{{ company?.name }}</div>
          <div class="company-desc">{{ company?.ticker }}·{{ company?.market }}</div>
        </div>
        <div class="company-price">{{ formatNumber(currentPrice) }}원</div>
      </div>

      <!-- 잔액 / 현재가 -->
      <div class="info-card">
        <div class="info-row">
          <span class="info-key">잔액</span>
          <span class="info-val">{{ formatNumber(balance) }}원</span>
        </div>
        <div class="info-row">
          <span class="info-key">현재가</span>
          <span class="info-val">{{ formatNumber(currentPrice) }}원</span>
        </div>
      </div>

      <!-- 수량 -->
      <div class="quantity-info">
        <div class="title">수량</div>
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

      <!-- 총 매수금액 / 남은 잔액 -->
      <div class="total-card">
        <div class="total-row">
          <span class="total-key">총 매수금액</span>
          <span class="total-amount">{{ formatNumber(totalAmount) }}원</span>
        </div>
        <div class="total-row">
          <span class="total-key">남은 잔액</span>
          <span :class="['total-remain', { negative: remaining < 0 }]">
            {{ formatNumber(remaining) }}원
          </span>
        </div>
      </div>

      <!-- 투자 가설 (F03) -->
      <div class="buy-reason">
        <div class="reason-title">왜 사는 거예요?</div>
        <div class="reason-desc">가설을 한 줄 적어두면, 나중에 결과를 돌아볼 수 있어요.</div>

        <div class="tag-container">
          <button
            v-for="tag in reasonTags"
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
          placeholder="예) HBM 수요가 4분기까지 이어진다는 기사를 보고 매수. 80,000원 회복 기대."
        />
      </div>
    </div>

    <footer class="footer">
      <button class="back" @click="onCancel">취소</button>
      <button class="buy-btn" :disabled="!canSubmit" @click="onSubmit">
        {{ quantity }}주 매수하기
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
const balance = ref(0)
const quantity = ref(0)
const selectedTag = ref('')
const reasonText = ref('')

const reasonTags = [
  { value: 'earnings', label: '실적 기대', emoji: '📈' },
  { value: 'news', label: '호재 뉴스', emoji: '📰' },
  { value: 'long', label: '장기 투자', emoji: '🌱' },
  { value: 'rebound', label: '단기 반등', emoji: '⚡' },
  { value: 'chart', label: '차트 패턴', emoji: '📊' },
  { value: 'etc', label: '기타', emoji: '✏️' },
]

// --- 계산값 ---
const maxShares = computed(() =>
  currentPrice.value > 0 ? Math.floor(balance.value / currentPrice.value) : 0,
)
const totalAmount = computed(() => quantity.value * currentPrice.value)
const remaining = computed(() => balance.value - totalAmount.value)
const canSubmit = computed(() => quantity.value > 0 && remaining.value >= 0)

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

function onCancel() {
  router.back()
}

function logoUrl(ticker) {
  return `https://file.alphasquare.co.kr/media/images/stock_logo/kr/${ticker}.png`
}

function onLogoError(e, companyName) {
  const initials = companyName?.slice(0, 2)
  e.target.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' rx='12' fill='%23ede9ff'/><text x='50%25' y='50%25' font-family='sans-serif' font-size='13' font-weight='800' fill='%237c5cff' text-anchor='middle' dominant-baseline='central'>${initials}</text></svg>`
  e.target.onerror = null
}

async function onSubmit() {
  if (!canSubmit.value) return
  if (!selectedTag.value) return toast.value.show('최소 1개 이상의 가설 태그를 선택해주세요.')

  try {
    // F02 모의 매수 + F03 투자 가설 작성
    // ⚠️ 필드명은 백엔드 /api/trades/buy, /api/reasons 명세에 맞춰 조정 필요
    const payload = {
      ticker: ticker,
      quantity: quantity.value,
      tradeType: 'BUY',
      reasonTag: selectedTag.value || null,
      reasonText: reasonText.value || null,
    }

    await tradesApi.orderStock(payload)

    router.replace({ name: 'portfolio-detail', params: { ticker } })
  } catch (e) {
    toast.value.show(e.response?.data?.message || '매수에 실패했어요. 잠시 후 다시 시도해주세요.')
  }
}

// --- 데이터 로드 ---
onMounted(async () => {
  // 종목 현재가: 라우트의 ticker로 상세 조회
  try {
    const res = await tradesApi.getBuyStock(ticker)
    const s = res.data
    if (s) {
      company.value = {
        name: s.stock.companyName,
        ticker: s.stock.ticker,
        sector: s.stock.sector,
        market: s.stock.market,
      }
      currentPrice.value = s.stock.currentPrice
      balance.value = s.balance
    }
  } catch (e) {
    // 종목 로드 실패
  }
})
</script>

<style scoped>
.buyview {
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

.stock-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #ede9ff;
  object-fit: contain;
  flex-shrink: 0;
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

/* 잔액 / 현재가 카드 */
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
.num-icon {
  margin-right: 4px;
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

/* 총 매수금액 */
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
.total-remain.negative {
  color: #e53935;
}

/* 투자 가설 */
.buy-reason {
  margin-top: 32px;
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
.buy-btn {
  flex: 1 0 0;
  height: 54px;
  border-radius: 16px;
  border: none;
  background: #e53935;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.12s;
}
.buy-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
