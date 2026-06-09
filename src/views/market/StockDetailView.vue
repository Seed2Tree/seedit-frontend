<template>
  <div class="detail-page">

    <!-- 탑바 -->
    <div class="topbar">
      <button class="icon-btn" @click="router.back()">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <div class="topbar-title">{{ stock?.companyName ?? '종목 상세' }}</div>
      <button class="icon-btn" @click="onToggleWatchlist">
        <svg width="22" height="22" viewBox="0 0 24 24"
          :fill="isWatched ? '#FFCB47' : 'none'"
          stroke="#FFCB47" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </button>
    </div>

    <!-- 로딩 -->
    <div v-if="isLoading" class="state-box">
      <div class="spinner" />
      <p>불러오는 중...</p>
    </div>

    <!-- 에러 -->
    <div v-else-if="error" class="state-box">
      <p>⚠️ 종목 정보를 불러오지 못했어요</p>
      <button class="retry-btn" @click="loadData">다시 시도</button>
    </div>

    <template v-else-if="stock">
      <!-- 현재가 -->
      <div class="price-section">
        <div class="ticker-code">{{ stock.ticker }}</div>
        <div class="current-price">{{ formatPrice(stock.currentPrice) }}</div>
        <div :class="['price-change', stock.changeRate >= 0 ? 'gain' : 'loss']">
          {{ formatRate(stock.changeRate) }}
          {{ stock.changeRate >= 0 ? '▲' : '▼' }} 오늘
        </div>
      </div>

      <!-- 차트 -->
      <div class="chart-card">
        <!-- SVG 라인 차트 -->
        <div class="chart-wrap">
          <svg
            v-if="chartPath"
            width="100%"
            height="160"
            :viewBox="`0 0 ${SVG_W} ${SVG_H}`"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient :id="`fill-${stock.sid}`" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="lineColor" stop-opacity="0.25"/>
                <stop offset="100%" :stop-color="lineColor" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <!-- 채우기 -->
            <path
              :d="`${chartPath} L ${SVG_W} ${SVG_H} L 0 ${SVG_H} Z`"
              :fill="`url(#fill-${stock.sid})`"
            />
            <!-- 라인 -->
            <path
              :d="chartPath"
              :stroke="lineColor"
              stroke-width="2.5"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <!-- 끝점 dot -->
            <circle
              v-if="lastPoint"
              :cx="lastPoint.x"
              :cy="lastPoint.y"
              r="4"
              :fill="lineColor"
            />
          </svg>
          <div v-else class="chart-empty">차트 데이터가 없어요</div>
        </div>

        <!-- 기간 선택 -->
        <div class="period-tabs">
          <button
            v-for="p in periods"
            :key="p.value"
            :class="['period-tab', { active: selectedPeriod === p.value }]"
            @click="onPeriodChange(p.value)"
          >{{ p.label }}</button>
        </div>
      </div>

      <!-- 종목 정보 -->
      <div class="info-card">
        <div class="info-title">한 줄 소개</div>
        <div class="info-body">{{ stock.description ?? `${stock.companyName}은(는) 코스피 상장 종목이에요.` }}</div>
        <div class="tag-list">
          <span v-for="tag in (stock.tags ?? [])" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>

      <div class="detail-bottom-spacer" />
    </template>

    <!-- 하단 매수/매도 버튼 -->
    <div v-if="stock" class="bottom-cta">
      <button class="btn-sell" @click="goSell">매도</button>
      <button class="btn-buy" @click="goBuy">매수하기</button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { stocksApi } from '@/api/stocks'
import { useStocksStore } from '@/stores/stocks'

const router = useRouter()
const route = useRoute()
const stocksStore = useStocksStore()

const stockId = route.params.stockId
const stock = ref(null)
const prices = ref([])               // [{ date, close }]
const isLoading = ref(false)
const error = ref(false)
const selectedPeriod = ref('1w')

const periods = [
  { label: '1일', value: '1d' },
  { label: '1주', value: '1w' },
  { label: '1달', value: '1m' },
  { label: '3달', value: '3m' },
  { label: '1년', value: '1y' },
]

// 관심종목 여부
const isWatched = computed(() => stocksStore.isWatched(stockId))

// 차트 색상: 상승 빨강 / 하락 파랑 (한국 주식 관례)
const lineColor = computed(() =>
  (stock.value?.changeRate ?? 0) >= 0 ? '#E53935' : '#1E6EF4'
)

// SVG 크기
const SVG_W = 320
const SVG_H = 140

// SVG path 계산
const chartPath = computed(() => {
  const pts = prices.value
  if (!pts.length) return null
  const values = pts.map((p) => p.close)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  return pts
    .map((p, i) => {
      const x = (i / (pts.length - 1)) * SVG_W
      const y = SVG_H - ((p.close - min) / range) * (SVG_H - 10)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
})

const lastPoint = computed(() => {
  const pts = prices.value
  if (!pts.length) return null
  const values = pts.map((p) => p.close)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const last = pts[pts.length - 1]
  return {
    x: SVG_W,
    y: SVG_H - ((last.close - min) / range) * (SVG_H - 10),
  }
})

async function loadData() {
  isLoading.value = true
  error.value = false
  try {
    const [detailRes, pricesRes] = await Promise.all([
      stocksApi.getDetail(stockId),
      stocksApi.getPrices(stockId, selectedPeriod.value),
    ])
    stock.value = detailRes.data
    prices.value = pricesRes.data
  } catch (e) {
    error.value = true
  } finally {
    isLoading.value = false
  }
}

async function onPeriodChange(period) {
  selectedPeriod.value = period
  try {
    const res = await stocksApi.getPrices(stockId, period)
    prices.value = res.data
  } catch (e) {
    // 차트 데이터만 실패 시 기존 유지
  }
}

function onToggleWatchlist() {
  stocksStore.toggleWatchlist(stockId)
}

function goBuy() {
  router.push({ name: 'stock-buy', params: { stockId } })
}

function goSell() {
  router.push({ name: 'stock-sell', params: { stockId } })
}

function formatPrice(price) {
  if (!price) return '-'
  return Number(price).toLocaleString('ko-KR') + '원'
}

function formatRate(rate) {
  if (rate === null || rate === undefined) return '-'
  const sign = rate >= 0 ? '+' : ''
  return `${sign}${Number(rate).toFixed(2)}%`
}

onMounted(() => {
  loadData()
  // 시장 데이터가 없으면 watchlist 정보를 위해 로드
  if (!stocksStore.stocks.length) {
    stocksStore.fetchList()
  }
})
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #f7f6fb;
  padding-bottom: 100px;
}

/* 탑바 */
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 52px 8px 8px;
  background: white;
  border-bottom: 1px solid #efedf4;
}
.topbar-title {
  font-size: 17px;
  font-weight: 700;
  color: #1E1A2E;
}
.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #1E1A2E;
  border-radius: 12px;
}
.icon-btn:active { background: #f7f6fb; }

/* 현재가 */
.price-section {
  background: white;
  padding: 16px 20px 20px;
}
.ticker-code {
  font-size: 12px;
  font-weight: 700;
  color: #A8A2B5;
}
.current-price {
  font-size: 34px;
  font-weight: 800;
  color: #1E1A2E;
  letter-spacing: -0.03em;
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}
.price-change {
  font-size: 14px;
  font-weight: 700;
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}
.gain { color: #E53935; }
.loss { color: #1E6EF4; }

/* 차트 */
.chart-card {
  margin: 16px 16px 0;
  background: white;
  border-radius: 18px;
  border: 1px solid #efedf4;
  padding: 16px 8px 12px;
  box-shadow: rgba(20,14,60,0.03) 0 0 0 1px, rgba(20,14,60,0.05) 0 2px 8px;
}
.chart-wrap {
  width: 100%;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.chart-empty {
  font-size: 13px;
  color: #A8A2B5;
}
.period-tabs {
  display: flex;
  justify-content: space-around;
  margin-top: 12px;
}
.period-tab {
  padding: 6px 14px;
  border-radius: 9999px;
  background: transparent;
  border: none;
  font-size: 12px;
  font-weight: 700;
  color: #7A7388;
  cursor: pointer;
  transition: all 0.15s;
}
.period-tab.active {
  background: #7C5CFF;
  color: white;
}

/* 종목 정보 */
.info-card {
  margin: 12px 16px 0;
  background: white;
  border-radius: 18px;
  border: 1px solid #efedf4;
  padding: 20px;
  box-shadow: rgba(20,14,60,0.03) 0 0 0 1px, rgba(20,14,60,0.05) 0 2px 8px;
}
.info-title {
  font-size: 15px;
  font-weight: 700;
  color: #1E1A2E;
  margin-bottom: 10px;
}
.info-body {
  font-size: 14px;
  line-height: 1.6;
  color: #4A4459;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}
.tag {
  padding: 4px 12px;
  border-radius: 9999px;
  background: #f2eeff;
  color: #7C5CFF;
  font-size: 12px;
  font-weight: 700;
}

.detail-bottom-spacer { height: 24px; }

/* 하단 CTA */
.bottom-cta {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 10px;
  padding: 12px 16px 36px;
  background: linear-gradient(180deg, rgba(247,246,251,0) 0%, #f7f6fb 30%);
}
.btn-buy, .btn-sell {
  flex: 1;
  height: 52px;
  border-radius: 16px;
  border: none;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.08s;
}
.btn-buy:active, .btn-sell:active { transform: scale(0.97); }
.btn-buy {
  background: #E53935;
  color: white;
}
.btn-sell {
  background: #EAF1FF;
  color: #1E6EF4;
}

/* 상태 */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 20px;
  color: #7A7388;
  font-size: 14px;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #efedf4;
  border-top-color: #7C5CFF;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.retry-btn {
  padding: 10px 24px;
  border-radius: 9999px;
  background: #7C5CFF;
  color: white;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
}
</style>
