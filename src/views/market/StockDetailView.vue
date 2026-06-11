<template>
  <div class="detail-page">

    <!-- 탑바 -->
    <div class="topbar">
      <button class="icon-btn" @click="router.back()">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <div class="topbar-title">{{ stock?.companyName ?? '종목 상세' }}</div>
      <button class="icon-btn" @click="onToggleWatchlist">
        <svg width="22" height="22" viewBox="0 0 24 24"
          :fill="isWatched ? '#7C5CFF' : 'none'"
          stroke="#7C5CFF" stroke-width="2">
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
      <!-- 현재가 헤더 -->
      <div class="price-section">
        <div class="meta-line">
          <span>
            {{ stock.ticker }} · {{ stock.market }}<template v-if="stock.sector"> · {{ stock.sector }}</template>
          </span>
          <span v-if="baseTimeLabel" class="base-time">{{ baseTimeLabel }}</span>
        </div>
        <div class="current-price">
          {{ formatNumber(stock.currentPrice) }}<span class="price-unit">원</span>
        </div>
        <div :class="['price-change', changeClass]">
          {{ formatChangePrice(stock.changePrice) }} · {{ formatRate(stock.changeRate) }} (전일 대비)
        </div>

        <!-- 매수/매도 -->
        <div class="cta-row">
          <button class="btn-buy" @click="goBuy">매수하기</button>
          <button class="btn-sell" @click="goSell">매도하기</button>
        </div>
      </div>

      <!-- 탭 -->
      <div class="tab-bar">
        <button
          v-for="t in tabs"
          :key="t.value"
          :class="['tab-item', { active: activeTab === t.value }]"
          @click="activeTab = t.value"
        >{{ t.label }}</button>
      </div>

      <!-- ============ 종합 탭 ============ -->
      <template v-if="activeTab === 'summary'">
        <div class="section-title">시세 정보</div>
        <div class="card">
          <!-- 52주 슬라이더 -->
          <div class="w52-slider">
            <div class="w52-badge" :style="{ left: w52Percent + '%' }">
              {{ formatNumber(stock.currentPrice) }}
            </div>
            <div class="w52-track">
              <div class="w52-thumb" :style="{ left: w52Percent + '%' }" />
            </div>
            <div class="w52-labels">
              <div class="w52-label">
                <span class="label-key">52주 최저</span>
                <span class="label-val">{{ formatNumber(stock.w52LowPrice) }}</span>
              </div>
              <div class="w52-label right">
                <span class="label-key">52주 최고</span>
                <span class="label-val">{{ formatNumber(stock.w52HighPrice) }}</span>
              </div>
            </div>
          </div>

          <!-- 시세 그리드 -->
          <div class="info-grid">
            <div class="grid-item">
              <span class="grid-key">시가</span>
              <span class="grid-val">{{ formatNumber(stock.openPrice) }}</span>
            </div>
            <div class="grid-item">
              <span class="grid-key">고가</span>
              <span class="grid-val">{{ formatNumber(stock.highPrice) }}</span>
            </div>
            <div class="grid-item">
              <span class="grid-key">전일</span>
              <span class="grid-val">{{ formatNumber(stock.prevClosePrice) }}</span>
            </div>
            <div class="grid-item">
              <span class="grid-key">저가</span>
              <span class="grid-val">{{ formatNumber(stock.lowPrice) }}</span>
            </div>
            <div class="grid-item">
              <span class="grid-key">거래량</span>
              <span class="grid-val">{{ formatVolume(stock.volume) }}</span>
            </div>
            <div class="grid-item">
              <span class="grid-key">거래대금</span>
              <span class="grid-val">{{ formatKoreanMoney(stock.tradingValue) }}</span>
            </div>
          </div>
        </div>

        <div class="section-title">이 회사가 하는 일</div>
        <div class="desc-text">
          {{ stock.description ?? `${stock.companyName}은(는) ${stock.market} 상장 종목이에요.` }}
        </div>

        <div class="section-title">종목 정보</div>
        <div class="card">
          <div class="info-grid">
            <div class="grid-item">
              <span class="grid-key">시가총액</span>
              <span class="grid-val">{{ formatMarketCap(stock.marketCap) }}</span>
            </div>
            <div class="grid-item">
              <span class="grid-key">외인비중</span>
              <span class="grid-val">{{ stock.foreignOwnershipPct != null ? stock.foreignOwnershipPct.toFixed(2) + '%' : '-' }}</span>
            </div>
            <div class="grid-item">
              <span class="grid-key">PER</span>
              <span class="grid-val">{{ stock.per != null ? stock.per.toFixed(2) : '-' }}</span>
            </div>
            <div class="grid-item">
              <span class="grid-key">EPS</span>
              <span class="grid-val">{{ formatNumber(stock.eps) }}</span>
            </div>
            <div class="grid-item">
              <span class="grid-key">PBR</span>
              <span class="grid-val">{{ stock.pbr != null ? stock.pbr.toFixed(2) : '-' }}</span>
            </div>
            <div class="grid-item">
              <span class="grid-key">BPS</span>
              <span class="grid-val">{{ formatNumber(stock.bps) }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- ============ 차트 탭 ============ -->
      <template v-else-if="activeTab === 'chart'">
        <!-- 기간 선택 -->
        <div class="period-tabs">
          <button
            v-for="p in periods"
            :key="p.value"
            :class="['period-tab', { active: selectedPeriod === p.value }]"
            @click="onPeriodChange(p.value)"
          >{{ p.label }}</button>
        </div>

        <!-- SVG 캔들 차트 -->
        <div class="chart-card">
          <div class="chart-wrap">
            <svg
              v-if="candleGeometry.length"
              width="100%"
              height="220"
              :viewBox="`0 0 ${SVG_W} ${SVG_H}`"
              preserveAspectRatio="none"
            >
              <g v-for="(c, i) in candleGeometry" :key="i">
                <!-- 꼬리(wick): 고가~저가 -->
                <line
                  :x1="c.cx" :x2="c.cx"
                  :y1="c.yHigh" :y2="c.yLow"
                  :stroke="c.color"
                  stroke-width="1"
                  vector-effect="non-scaling-stroke"
                />
                <!-- 몸통(body): 시가~종가 -->
                <rect
                  :x="c.x" :y="c.yBody"
                  :width="c.w" :height="c.h"
                  :fill="c.color"
                />
              </g>
            </svg>
            <div v-else class="chart-empty">차트 데이터가 없어요</div>
          </div>

          <!-- X축 라벨 -->
          <div v-if="xLabels.length" class="x-labels">
            <span v-for="(label, i) in xLabels" :key="i">{{ label }}</span>
          </div>
        </div>
      </template>

      <!-- ============ 뉴스 탭 ============ -->
      <template v-else>
        <div class="state-box">
          <p>뉴스 기능은 준비 중이에요 📰</p>
        </div>
      </template>

      <div class="detail-bottom-spacer" />
    </template>

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

const ticker = route.params.ticker
const stock = ref(null)
const candles = ref([])              // [{ date, open, close, high, low }]
const isLoading = ref(false)
const error = ref(false)
const activeTab = ref('summary')
const selectedPeriod = ref('1m')

const tabs = [
  { label: '종합', value: 'summary' },
  { label: '차트', value: 'chart' },
  { label: '뉴스', value: 'news' },
]

const periods = [
  { label: '1일', value: '1d' },
  { label: '1주', value: '1w' },
  { label: '1개월', value: '1m' },
  { label: '3개월', value: '3m' },
  { label: '1년', value: '1y' },
  { label: '5년', value: '5y' },
]

// 관심종목 여부 (sid 기준)
const isWatched = computed(() => stock.value && stocksStore.isWatched(stock.value.sid))

// 상승 빨강 / 하락 파랑
const changeClass = computed(() =>
  (stock.value?.changeRate ?? 0) >= 0 ? 'gain' : 'loss'
)

// 52주 밴드 내 현재가 위치 (%)
const w52Percent = computed(() => {
  const s = stock.value
  if (!s || s.w52HighPrice == null || s.w52LowPrice == null) return 50
  const range = s.w52HighPrice - s.w52LowPrice
  if (range <= 0) return 50
  const pct = ((s.currentPrice - s.w52LowPrice) / range) * 100
  return Math.min(100, Math.max(0, pct))
})

// 데이터 기준 시각: 오전 배치(10시)/오후 배치(16시) 중 어느 쪽 데이터인지 표시
const baseTimeLabel = computed(() => {
  const s = stock.value
  if (!s?.tradeDate) return ''
  const d = new Date(s.tradeDate)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  // 오늘 데이터인데 아직 16시 전이면 10시 배치분, 그 외엔 16시 확정분
  const hour = isToday && now.getHours() < 16 ? 10 : 16
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${hour}시 기준`
})

// SVG 크기
const SVG_W = 320
const SVG_H = 200
const PAD_Y = 16

// 캔들 좌표 계산: y축 = 전체 저가~고가 범위, x축 = 캔들당 균등 밴드
const candleGeometry = computed(() => {
  const cs = candles.value
  if (!cs.length) return []
  const max = Math.max(...cs.map((c) => c.high))
  const min = Math.min(...cs.map((c) => c.low))
  const range = max - min || 1
  const y = (v) => SVG_H - PAD_Y - ((v - min) / range) * (SVG_H - PAD_Y * 2)

  const band = SVG_W / cs.length
  const w = Math.min(band * 0.6, 24)   // 몸통 폭 (캔들 적을 때 과대 방지)

  return cs.map((c, i) => {
    const cx = band * i + band / 2
    const yOpen = y(c.open)
    const yClose = y(c.close)
    return {
      cx,
      x: cx - w / 2,
      w,
      yHigh: y(c.high),
      yLow: y(c.low),
      yBody: Math.min(yOpen, yClose),
      h: Math.max(Math.abs(yOpen - yClose), 1.5),  // 시가=종가(도지)여도 최소 두께
      color: c.close >= c.open ? '#E53935' : '#1E6EF4',  // 양봉 빨강 / 음봉 파랑
    }
  })
})

// X축 라벨: 데이터 범위에서 고르게 3~4개 추출
const xLabels = computed(() => {
  const cs = candles.value
  if (cs.length < 2) return []
  const count = Math.min(4, cs.length)
  const labels = []
  for (let i = 0; i < count; i++) {
    const idx = Math.floor((i / (count - 1)) * (cs.length - 1))
    labels.push(formatDateLabel(cs[idx].date, selectedPeriod.value))
  }
  return labels
})

function formatDateLabel(dateStr, period) {
  const d = new Date(dateStr)
  if (period === '1d' || period === '1w') return `${d.getMonth() + 1}.${d.getDate()}`
  if (period === '1y' || period === '5y') return `${String(d.getFullYear()).slice(2)}년 ${d.getMonth() + 1}월`
  return `${d.getMonth() + 1}월`
}

async function loadData() {
  isLoading.value = true
  error.value = false
  try {
    const [detailRes, pricesRes] = await Promise.all([
      stocksApi.getDetail(ticker),
      stocksApi.getPrices(ticker, selectedPeriod.value),
    ])
    stock.value = detailRes.data
    candles.value = pricesRes.data
  } catch (e) {
    error.value = true
  } finally {
    isLoading.value = false
  }
}

async function onPeriodChange(period) {
  selectedPeriod.value = period
  try {
    const res = await stocksApi.getPrices(ticker, period)
    candles.value = res.data
  } catch (e) {
    // 차트 데이터만 실패 시 기존 유지
  }
}

function onToggleWatchlist() {
  if (stock.value) stocksStore.toggleWatchlist(stock.value.sid)
}

function goBuy() {
  router.push({ name: 'stock-buy', params: { ticker } })
}

function goSell() {
  router.push({ name: 'stock-sell', params: { ticker } })
}

function formatNumber(n) {
  if (n === null || n === undefined) return '-'
  return Number(n).toLocaleString('ko-KR')
}

function formatChangePrice(n) {
  if (n === null || n === undefined) return '-'
  const sign = n >= 0 ? '+' : '−'
  return `${sign}${Math.abs(n).toLocaleString('ko-KR')}원`
}

function formatRate(rate) {
  if (rate === null || rate === undefined) return '-'
  const sign = rate >= 0 ? '+' : '−'
  return `${sign}${Math.abs(rate).toFixed(2)}%`
}

// 거래량: 1만 주 이상이면 만 단위
function formatVolume(n) {
  if (n === null || n === undefined) return '-'
  if (n >= 10000) return Math.round(n / 10000).toLocaleString('ko-KR') + '만'
  return n.toLocaleString('ko-KR')
}

// 원 단위 금액 → 조/억
function formatKoreanMoney(n) {
  if (n === null || n === undefined) return '-'
  if (n >= 1e12) return (n / 1e12).toFixed(1).replace(/\.0$/, '') + '조'
  if (n >= 1e8) return Math.round(n / 1e8).toLocaleString('ko-KR') + '억'
  return n.toLocaleString('ko-KR')
}

// 시가총액: DB에 억원 단위로 저장됨 → 조/억
function formatMarketCap(n) {
  if (n === null || n === undefined) return '-'
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '조'
  return n.toLocaleString('ko-KR') + '억'
}

onMounted(() => {
  loadData()
  // 관심종목 표시를 위해 목록 데이터가 없으면 로드
  if (!stocksStore.stocks.length) {
    stocksStore.fetchList()
  }
})
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 40px;
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

/* 현재가 헤더 */
.price-section {
  padding: 8px 20px 16px;
}
.meta-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: #A8A2B5;
}
.base-time {
  font-size: 11px;
  font-weight: 500;
  color: #B5B0C2;
}
.current-price {
  font-size: 38px;
  font-weight: 800;
  color: #1E1A2E;
  letter-spacing: -0.03em;
  margin-top: 6px;
  font-variant-numeric: tabular-nums;
}
.price-unit {
  font-size: 18px;
  font-weight: 700;
  margin-left: 4px;
  color: #4A4459;
}
.price-change {
  font-size: 14px;
  font-weight: 700;
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}
.gain { color: #E53935; }
.loss { color: #1E6EF4; }

/* 매수/매도 */
.cta-row {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
.btn-buy, .btn-sell {
  flex: 1;
  height: 50px;
  border-radius: 14px;
  border: none;
  font-size: 16px;
  font-weight: 700;
  color: white;
  cursor: pointer;
  transition: transform 0.08s;
}
.btn-buy:active, .btn-sell:active { transform: scale(0.97); }
.btn-buy { background: #D9534F; }
.btn-sell { background: #5B74F2; }

/* 탭 */
.tab-bar {
  display: flex;
  gap: 4px;
  padding: 0 12px;
  border-bottom: 1px solid #efedf4;
}
.tab-item {
  padding: 12px 16px;
  background: none;
  border: none;
  font-size: 15px;
  font-weight: 700;
  color: #A8A2B5;
  cursor: pointer;
  border-bottom: 2.5px solid transparent;
  margin-bottom: -1px;
}
.tab-item.active {
  color: #1E1A2E;
  border-bottom-color: #1E1A2E;
}

/* 섹션 */
.section-title {
  font-size: 17px;
  font-weight: 800;
  color: #1E1A2E;
  margin: 24px 20px 12px;
}
.card {
  margin: 0 16px;
  background: #fbfafd;
  border-radius: 18px;
  border: 1px solid #efedf4;
  padding: 20px 18px;
}
.desc-text {
  margin: 0 20px;
  font-size: 14px;
  line-height: 1.7;
  color: #4A4459;
}

/* 52주 슬라이더 */
.w52-slider {
  position: relative;
  padding-top: 34px;
  margin-bottom: 20px;
}
.w52-badge {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  background: #f2eeff;
  color: #7C5CFF;
  font-size: 12px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 9999px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.w52-track {
  position: relative;
  height: 6px;
  border-radius: 9999px;
  background: #ece9f3;
}
.w52-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #7C5CFF;
  border: 3px solid white;
  box-shadow: 0 1px 4px rgba(20,14,60,0.25);
}
.w52-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}
.w52-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.w52-label.right { align-items: flex-end; }
.label-key {
  font-size: 11px;
  color: #A8A2B5;
  font-weight: 600;
}
.label-val {
  font-size: 14px;
  font-weight: 800;
  color: #1E1A2E;
  font-variant-numeric: tabular-nums;
}

/* 정보 그리드 (2열: 키-값) */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 24px;
  row-gap: 14px;
}
.grid-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.grid-key {
  font-size: 13px;
  color: #7A7388;
  font-weight: 600;
}
.grid-val {
  font-size: 14px;
  font-weight: 800;
  color: #1E1A2E;
  font-variant-numeric: tabular-nums;
}

/* 기간 선택 */
.period-tabs {
  display: flex;
  gap: 8px;
  padding: 16px 16px 0;
  overflow-x: auto;
}
.period-tab {
  padding: 8px 14px;
  border-radius: 9999px;
  background: white;
  border: 1px solid #e5e2ec;
  font-size: 13px;
  font-weight: 700;
  color: #4A4459;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.period-tab.active {
  background: #1E1A2E;
  border-color: #1E1A2E;
  color: white;
}

/* 차트 */
.chart-card {
  margin: 16px 16px 0;
  padding: 8px 4px 4px;
}
.chart-wrap {
  position: relative;
  width: 100%;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* 끝점 동그라미가 viewBox 경계(x=320)에 걸려도 잘리지 않게 */
.chart-wrap svg {
  overflow: visible;
}
.chart-empty {
  font-size: 13px;
  color: #A8A2B5;
}
.x-labels {
  display: flex;
  justify-content: space-between;
  padding: 8px 8px 0;
  font-size: 11px;
  color: #A8A2B5;
  font-weight: 600;
}

.detail-bottom-spacer { height: 24px; }

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
