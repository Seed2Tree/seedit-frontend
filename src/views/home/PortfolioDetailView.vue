<template>
  <div class="pd-page">
    <!-- 로딩 / 에러 -->
    <div v-if="loading" class="state-box">
      <div class="spinner" />
      <p>불러오는 중...</p>
    </div>
    <div v-else-if="error" class="state-box">
      <p>⚠️ 정보를 불러오지 못했어요</p>
      <button class="retry-btn" @click="load()">다시 시도</button>
    </div>

    <template v-else>
      <!-- 종목 헤더 -->
      <div class="pd-header">
        <div class="pd-container">
          <div class="stock-avatar">{{ stock.companyName?.slice(0, 2) }}</div>
          <div class="head-info">
            <div class="head-name">{{ stock.companyName }}</div>
            <div class="head-sub">{{ stock.ticker }} · {{ stock.market }}</div>
          </div>
          <button class="link-detail" @click="goStockDetail">종목 상세 ›</button>
        </div>
        <!-- 매수/매도 -->
        <div v-if="!loading && !error" class="cta-row">
          <button class="btn-buy" @click="goBuy">추가 매수</button>
          <button class="btn-sell" @click="goSell">매도하기</button>
        </div>
      </div>

      <!-- 보유 요약 카드 -->
      <div class="summary-card">
        <div class="s-eval">
          <p class="s-label">평가금액</p>
          <span class="s-amount">{{ formatPrice(evalAmount) }}</span>
        </div>
        <div class="s-profit" :class="profit >= 0 ? 'gain' : 'loss'">
          {{ formatSigned(profit) }}원 · {{ formatRate(profitRate) }}
        </div>
        <div class="s-grid">
          <div class="s-cell">
            <p>현재가</p>
            {{ formatPrice(currentPrice) }}
          </div>
          <div class="s-cell">
            <p>평단가</p>
            {{ formatPrice(avgPrice) }}
          </div>
          <div class="s-cell">
            <p>보유 수량</p>
            {{ quantity }}주
          </div>
          <div class="s-cell">
            <p>매입금액</p>
            {{ formatPrice(cost) }}
          </div>
        </div>
      </div>

      <!-- 투자 가설 (매수 시 작성) -->
      <div class="section" v-if="buyReasons.length">
        <div class="section-label">처음 살 때 이유</div>
        <div class="reason-card" v-for="(r, i) in buyReasons" :key="'b' + i">
          <div class="reason-badge">
            <span>{{ r.emoji }}</span> {{ r.label }}
            <span v-if="r.date" class="reason-date"> · {{ r.date }}</span>
          </div>
          <p class="reason-text">"{{ r.text }}"</p>
        </div>
      </div>

      <!-- 투자 복기 (매도 시 작성) -->
      <div class="section" v-if="sellReasons.length">
        <div class="section-label">팔 때 복기</div>
        <div class="reason-card" v-for="(r, i) in sellReasons" :key="'s' + i">
          <div class="reason-badge">
            <span>{{ r.emoji }}</span> {{ r.label }}
            <span v-if="r.date" class="reason-date"> · {{ r.date }}</span>
          </div>
          <p class="reason-text">"{{ r.text }}"</p>
        </div>
      </div>

      <!-- 거래 내역 -->
      <div class="section">
        <div class="section-label">거래 내역</div>
        <div v-if="trades.length === 0" class="empty">아직 거래 내역이 없어요.</div>
        <div v-else class="trade-list">
          <div v-for="t in trades" :key="t.tid" class="trade-row">
            <div class="trade-left">
              <span class="trade-type" :class="t.tradeType === 'BUY' ? 'buy' : 'sell'">
                {{ t.tradeType === 'BUY' ? '매수' : '매도' }}
              </span>
              <span class="trade-date">{{ formatDateTime(t.tradeAt) }}</span>
            </div>
            <div class="trade-right">
              <div class="trade-amount">{{ formatPrice(t.totalAmount) }}</div>
              <div class="trade-detail">{{ t.quantity }}주 · {{ formatPrice(t.tradePrice) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="bottom-spacer" />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { tradesApi } from '@/api/trades'

const router = useRouter()
const route = useRoute()
const ticker = route.params.ticker

const loading = ref(false)
const error = ref(false)
const stock = ref({})
const portfolio = ref({})
const reasons = ref([])
const trades = ref([])

const tagEmoji = {
  '실적 기대': '📈',
  '호재 뉴스': '📰',
  '장기 투자': '🌱',
  '단기 반등': '⚡',
  '차트 패턴': '📊',
  '목표가 도달': '🎯',
  손절: '✂️',
  악재: '📉',
  '다른 종목으로': '🔄',
  기타: '✏️',
}

// 보유 지표
const currentPrice = computed(() => stock.value.currentPrice ?? 0)
const avgPrice = computed(() => portfolio.value.avgPrice ?? 0)
const quantity = computed(() => portfolio.value.quantity ?? 0)
const cost = computed(() => portfolio.value.totalAmount ?? avgPrice.value * quantity.value)
const evalAmount = computed(() => currentPrice.value * quantity.value)
const profit = computed(() => evalAmount.value - cost.value)
const profitRate = computed(() => (cost.value > 0 ? (profit.value / cost.value) * 100 : 0))

const buyReasons = computed(() => mapReasons('BUY'))
const sellReasons = computed(() => mapReasons('SELL'))
function mapReasons(type) {
  return reasons.value
    .filter((r) => r.reasonType === type)
    .map((r) => ({
      label: r.reasonTag,
      emoji: tagEmoji[r.reasonTag] ?? '✏️',
      date: formatDate(r.reasonDate),
      text: r.reasonText,
    }))
}

async function load() {
  loading.value = true
  error.value = false
  try {
    const res = await tradesApi.getSellStock(ticker)
    const d = res.data
    stock.value = d.stock ?? {}
    portfolio.value = d.portfolio ?? {}
    reasons.value = d.reasons ?? []

    const sid = portfolio.value.sid
    if (sid != null) {
      const tRes = await tradesApi.getTradeHistoryByStockId(sid)
      trades.value = (tRes.data ?? []).sort((a, b) => new Date(b.tradeAt) - new Date(a.tradeAt))
    }
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}
onMounted(load)

function goStockDetail() {
  router.push({ name: 'stock-detail', params: { ticker } })
}
function goBuy() {
  router.push({ name: 'stock-buy', params: { ticker } })
}
function goSell() {
  router.push({ name: 'stock-sell', params: { ticker } })
}

function formatPrice(n) {
  if (n == null) return '-'
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
function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}월 ${d.getDate()}일`
}
function formatDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.pd-page {
  min-height: 100vh;
  background: #f7f6fb;
  padding-bottom: 100px;
}

/* 헤더 */
.pd-header {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #efedf4;
  background: #fff;
  padding: 18px 20px;
  gap: 16px;

  .pd-container {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}
.stock-avatar {
  width: 44px;
  height: 44px;
  border-radius: 13px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #7c5cff;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
}
.head-info {
  flex: 1;
  min-width: 0;
}
.head-name {
  font-size: 16px;
  font-weight: 800;
  color: #1e1a2e;
}
.head-sub {
  font-size: 12px;
  color: #a8a2b5;
  margin-top: 2px;
}
.link-detail {
  background: none;
  border: none;
  color: #7c5cff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

/* 요약 카드 */
.summary-card {
  margin: 16px 20px 0;
  padding: 18px 20px;
  border-radius: 20px;
  background: #f2eeff;
}
.s-eval {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.s-label {
  font-size: 12px;
  color: #6b5fa6;
  font-weight: 500;
}
.s-amount {
  font-size: 26px;
  font-weight: 800;
  color: #2b1b7a;
  font-variant-numeric: tabular-nums;
}
.s-profit {
  margin-top: 6px;
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.s-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
  margin-top: 16px;
}
.s-cell {
  font-size: 14px;
  font-weight: 700;
  color: #1e1a2e;
  font-variant-numeric: tabular-nums;
}
.s-cell p {
  font-size: 11px;
  font-weight: 500;
  color: #7a7388;
  margin-bottom: 3px;
}

/* 섹션 */
.section {
  padding: 20px 20px 0;
}
.section-label {
  font-size: 14px;
  font-weight: 800;
  color: #1e1a2e;
  margin-bottom: 10px;
}
.empty {
  color: #a8a2b5;
  font-size: 13px;
  padding: 14px 0;
}

/* 가설/복기 카드 */
.reason-card {
  background: #fff;
  border: 1px solid #efedf4;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 8px;
}
.reason-badge {
  font-size: 13px;
  font-weight: 700;
  color: #1e1a2e;
}
.reason-date {
  color: #a8a2b5;
  font-weight: 500;
}
.reason-text {
  font-size: 13px;
  color: #4a4458;
  margin-top: 6px;
  line-height: 1.5;
}

/* 거래 내역 */
.trade-list {
  background: #fff;
  border: 1px solid #efedf4;
  border-radius: 14px;
  overflow: hidden;
}
.trade-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f0eef6;
}
.trade-row:last-child {
  border-bottom: none;
}
.trade-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.trade-type {
  font-size: 12px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 8px;
}
.trade-type.buy {
  color: #e53935;
  background: #fdeceb;
}
.trade-type.sell {
  color: #1e6ef4;
  background: #e9f1fe;
}
.trade-date {
  font-size: 12px;
  color: #a8a2b5;
}
.trade-right {
  text-align: right;
}
.trade-amount {
  font-size: 14px;
  font-weight: 700;
  color: #1e1a2e;
  font-variant-numeric: tabular-nums;
}
.trade-detail {
  font-size: 11px;
  color: #a8a2b5;
  margin-top: 2px;
}

/* 색 */
.gain {
  color: #e53935;
}
.loss {
  color: #1e6ef4;
}

/* 푸터 버튼 */
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 10px;
  padding: 12px 20px;
  background: #fff;
  border-top: 1px solid #efedf4;
}

/* 상태 */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
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
  font-weight: 700;
  border: none;
  cursor: pointer;
}
.bottom-spacer {
  height: 20px;
}

/* 매수/매도 */
.cta-row {
  display: flex;
  gap: 10px;
  background: #fff;
}
.btn-buy,
.btn-sell {
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
.btn-buy:active,
.btn-sell:active {
  transform: scale(0.97);
}
.btn-buy {
  background: #d9534f;
}
.btn-sell {
  background: #5b74f2;
}
</style>
