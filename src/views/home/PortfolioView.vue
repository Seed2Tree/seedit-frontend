<template>
  <div class="market-page">
    <!-- 헤더: 제목 + 요약 카드 (제목 옆 필터 제거) -->
    <div class="market-header">
      <div class="page-title">보유 종목</div>

      <div class="summary-card">
        <div class="s-title">
          <p class="p-title">총 평가금액</p>
          {{ formatPrice(myPortfolio.totalEval) }}
        </div>
        <div>
          <div class="p-content">
            <div class="s-content">
              <p>총 매입금</p>
              {{ formatPrice(myPortfolio.totalCost) }}
            </div>
            <div class="s-content">
              <p>예수금</p>
              {{ formatPrice(myPortfolio.balance) }}
            </div>
          </div>
          <div class="p-content">
            <div class="s-content" :class="myPortfolio.totalProfit >= 0 ? 'gain' : 'loss'">
              <p>총 수익금</p>
              {{ formatSigned(myPortfolio.totalProfit) }}원
            </div>
            <div class="s-content" :class="myPortfolio.totalProfit >= 0 ? 'gain' : 'loss'">
              <p>총 수익률</p>
              {{ formatRate(myPortfolio.totalProfitRate) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 로딩 / 에러 -->
    <div v-if="loading" class="state-box">
      <div class="spinner" />
      <p>종목 불러오는 중...</p>
    </div>
    <div v-else-if="error" class="state-box">
      <p>⚠️ 종목을 불러오지 못했어요</p>
      <button class="retry-btn" @click="load()">다시 시도</button>
    </div>

    <template v-else>
      <div class="section">
        <!-- "보유 종목 N" + 정렬 탭 -->
        <div class="section-head">
          <div class="section-label">보유 종목 {{ holdings.length }}</div>
          <div class="filter-tabs">
            <button
              :class="['filter-tab', { active: sortKey === 'rate' }]"
              @click="sortKey = 'rate'"
            >
              수익률순
            </button>
            <button
              :class="['filter-tab', { active: sortKey === 'amount' }]"
              @click="sortKey = 'amount'"
            >
              금액순
            </button>
          </div>
        </div>

        <!-- 검색 (정렬 탭 아래) -->
        <div class="search-wrap">
          <svg
            class="search-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            v-model="query"
            class="search-input"
            type="text"
            placeholder="종목명 또는 코드 검색"
          />
          <button v-if="query" class="search-clear" @click="query = ''">✕</button>
        </div>

        <!-- 빈 상태 -->
        <div v-if="displayedHoldings.length === 0" class="state-box">
          <p>{{ query ? `'${query}' 검색 결과가 없어요` : '보유 종목이 없어요' }}</p>
        </div>

        <!-- 리스트 -->
        <div v-else class="stock-list">
          <button
            v-for="stock in displayedHoldings"
            :key="stock.ticker"
            class="stock-row"
            @click="goDetail(stock)"
          >
            <div>
              <div :class="['stock-icon']">
                <img
                  :src="logoUrl(stock?.ticker)"
                  class="stock-avatar"
                  :alt="stock?.companyName?.slice(0, 2)"
                  @error="(e) => onLogoError(e, stock?.companyName)"
                />
              </div>
              <div class="stock-info">
                <div class="stock-name">{{ stock.companyName }}</div>
                <div class="stock-code">{{ stock.ticker }}</div>
              </div>
              <div class="stock-price-wrap">
                <div class="stock-price">{{ formatPrice(stock.currentPrice) }}</div>
                <div :class="['change-rate', stock.profitRate >= 0 ? 'gain' : 'loss']">
                  {{ formatRate(stock.profitRate) }} · {{ formatSigned(stock.evalProfit) }}원
                </div>
              </div>
              <div class="stock-detail-info">
                <div class="stock-price-info">
                  <div>현재가</div>
                  <div>{{ formatPrice(stock.currentPrice) }}</div>
                </div>
                <div class="stock-price-info">
                  <div>평단가</div>
                  <div>{{ formatPrice(stock.avgPrice) }}</div>
                </div>
                <div class="stock-price-info">
                  <div>수량</div>
                  <div>{{ stock.quantity }}주</div>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { tradesApi } from '@/api/trades'

const router = useRouter()

const holdings = ref([])
const myPortfolio = ref({
  totalCost: 0,
  totalEval: 0,
  totalProfit: 0,
  totalProfitRate: 0,
  balance: 0,
})

function logoUrl(ticker) {
  return `https://file.alphasquare.co.kr/media/images/stock_logo/kr/${ticker}.png`
}

function onLogoError(e, companyName) {
  const initials = companyName?.slice(0, 2)
  e.target.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' rx='12' fill='%23ede9ff'/><text x='50%25' y='50%25' font-family='sans-serif' font-size='13' font-weight='800' fill='%237c5cff' text-anchor='middle' dominant-baseline='central'>${initials}</text></svg>`
  e.target.onerror = null
}
const query = ref('')
const sortKey = ref('rate') // 'rate' | 'amount'
const loading = ref(false)
const error = ref(false)

async function load() {
  loading.value = true
  error.value = false
  try {
    const res = await tradesApi.getPortfolio()
    holdings.value = res.data.holdings ?? []
    myPortfolio.value = { ...res.data }
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}
onMounted(load)

const displayedHoldings = computed(() => {
  let list = [...holdings.value]
  const q = query.value.trim()
  if (q) list = list.filter((s) => s.companyName.includes(q) || s.ticker.includes(q))
  list.sort((a, b) =>
    sortKey.value === 'rate'
      ? b.profitRate - a.profitRate
      : b.currentPrice * b.quantity - a.currentPrice * a.quantity,
  )
  return list
})

function goDetail(stock) {
  router.push({ name: 'portfolio-detail', params: { ticker: stock.ticker } })
}

function formatPrice(n) {
  if (n == null) return '-' // 0원도 표기되도록 !n 대신 == null
  return Number(n).toLocaleString('ko-KR') + '원'
}
function formatSigned(n) {
  if (n == null) return '-'
  const sign = n >= 0 ? '+' : '−'
  return `${sign}${Math.abs(n).toLocaleString('ko-KR')}`
}
function formatRate(rate) {
  if (rate == null) return '-'
  const sign = rate >= 0 ? '+' : ''
  return `${sign}${Number(rate).toFixed(2)}%`
}
</script>
<style scoped>
.market-page {
  min-height: 100vh;
  background: #f7f6fb;
  padding-bottom: 100px;
}

/* ===== 헤더 ===== */
.market-header {
  background: #fff;
  padding: 12px 20px 20px;
  border-bottom: 1px solid #efedf4;
}
.page-title {
  font-size: 24px;
  font-weight: 800;
  color: #1e1a2e;
  letter-spacing: -0.02em;
}

/* ===== 요약 카드 ===== */
.summary-card {
  margin-top: 16px;
  padding: 18px 20px;
  border-radius: 20px;
  background: #f2eeff;
}
.s-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 28px;
  font-weight: 800;
  color: #2b1b7a;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  padding-bottom: 14px;
}
.s-title .p-title {
  font-size: 12px;
  font-weight: 500;
  color: #6b5fa6;
}
.p-content {
  display: flex;
  gap: 16px;
  padding-bottom: 5px;
}
.s-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 16px;
  font-weight: 700;
  color: #1e1a2e;
  font-variant-numeric: tabular-nums;
}
.s-content p {
  font-size: 12px;
  font-weight: 500;
  color: #7a7388;
}
/* 수익 색상 (값에만 적용, 라벨은 위 p 규칙이 유지) */
.s-content.gain {
  color: #e53935;
}
.s-content.loss {
  color: #1e6ef4;
}

/* ===== 섹션 헤더 (보유 종목 N + 정렬 탭) ===== */
.section {
  padding: 20px 20px 0;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.section-label {
  font-size: 15px;
  font-weight: 800;
  color: #1e1a2e;
}

/* ===== 정렬/필터 탭 ===== */
.filter-tabs {
  display: flex;
  gap: 6px;
}
.filter-tab {
  height: 30px;
  padding: 0 14px;
  border-radius: 9999px;
  border: 1.5px solid #e4e2ed;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: #7a7388;
  cursor: pointer;
  transition: all 0.15s;
}
.filter-tab.active {
  background: #7c5cff;
  border-color: #7c5cff;
  color: #fff;
}

/* ===== 검색 ===== */
.search-wrap {
  position: relative;
  margin-bottom: 14px;
}
.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #a8a2b5;
}
.search-input {
  width: 100%;
  height: 46px;
  background: #fff;
  border: 1.5px solid #efedf4;
  border-radius: 14px;
  padding: 0 40px 0 44px;
  font-size: 15px;
  color: #1e1a2e;
  outline: none;
}
.search-input:focus {
  border-color: #7c5cff;
}
.search-clear {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #a8a2b5;
  font-size: 14px;
  background: none;
  border: none;
  cursor: pointer;
}

/* ===== 종목 리스트 ===== */
.stock-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.stock-row {
  width: 100%;
  padding: 16px 18px;
  text-align: left;
  background: #fff;
  border: 1px solid #efedf4;
  border-radius: 18px;
  cursor: pointer;
  transition: transform 0.1s;
  box-shadow:
    rgba(20, 14, 60, 0.03) 0 0 0 1px,
    rgba(20, 14, 60, 0.05) 0 2px 8px;
}
.stock-row:active {
  transform: scale(0.99);
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

/* 한 행 내부 레이아웃: 윗줄(아바타+이름+가격) / 아랫줄(상세) */
.stock-row > div {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.stock-avatar {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  color: #fff;
}
.stock-info {
  flex: 1;
  min-width: 0;
}
.stock-name {
  font-size: 15px;
  font-weight: 700;
  color: #1e1a2e;
}
.stock-code {
  font-size: 12px;
  color: #a8a2b5;
  margin-top: 2px;
}
.stock-price-wrap {
  margin-left: auto;
  text-align: right;
}
.stock-price {
  font-size: 16px;
  font-weight: 800;
  color: #1e1a2e;
  font-variant-numeric: tabular-nums;
}
.change-rate {
  margin-top: 3px;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* 상세 행 (현재가 / 평단가 / 수량) */
.stock-detail-info {
  width: 100%;
  display: flex;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f0eef6;
}
.stock-price-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stock-price-info > div:first-child {
  font-size: 11px;
  color: #a8a2b5;
}
.stock-price-info > div:last-child {
  font-size: 13px;
  font-weight: 700;
  color: #4a4458;
  font-variant-numeric: tabular-nums;
}

/* ===== 수익/손실 색 ===== */
.gain {
  color: #e53935;
}
.loss {
  color: #1e6ef4;
}

/* ===== 상태 (로딩/에러/빈) ===== */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 20px;
  color: #7a7388;
  font-size: 14px;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #efedf4;
  border-top-color: #7c5cff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.retry-btn {
  padding: 10px 24px;
  border-radius: 9999px;
  background: #7c5cff;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
}
</style>
