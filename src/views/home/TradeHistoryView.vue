<template>
  <div class="history-page">
    <!-- ===== 상단 컬러 헤더: 예수금 + 액션 ===== -->
    <div class="balance-header">
      <div class="bh-label">예수금</div>
      <div class="bh-value">{{ won(balance) }}<span class="bh-unit">원</span></div>
      <div class="bh-actions">
        <button class="bh-btn" @click="goPortfolio">보유종목</button>
        <button class="bh-btn" @click="goMarket">매매하기</button>
      </div>
    </div>

    <!-- ===== 기간 필터 ===== -->
    <div class="filter-bar">
      <div class="period-pills">
        <button
          v-for="p in periods"
          :key="p.value"
          :class="['period-pill', { active: period === p.value }]"
          @click="period = p.value"
        >
          {{ p.label }}
        </button>
      </div>
      <span class="sort-label">최신순</span>
    </div>

    <!-- ===== 기간 내 합계 ===== -->
    <div class="period-summary">
      <span class="ps-label">기간 내 내역</span>
      <span :class="['ps-total', periodNet >= 0 ? 'plus' : 'minus']">
        총 {{ signed(periodNet) }}원
      </span>
    </div>

    <!-- 로딩 / 에러 / 빈 상태 -->
    <div v-if="loading" class="state-box">
      <div class="spinner" />
      <p>거래 내역 불러오는 중...</p>
    </div>
    <div v-else-if="error" class="state-box">
      <p>⚠️ 거래 내역을 불러오지 못했어요</p>
      <button class="retry-btn" @click="load">다시 시도</button>
    </div>
    <div v-else-if="!filtered.length" class="state-box">
      <p>이 기간엔 거래 내역이 없어요 📭</p>
    </div>

    <!-- ===== 거래 리스트 (은행 거래내역 스타일) ===== -->
    <div v-else class="ledger">
      <article v-for="t in filtered" :key="t.tid" class="ledger-row" @click="goTradeDetail(t.tid)">
        <div class="lr-date">{{ formatDate(t.tradeAt) }}</div>

        <div class="lr-main">
          <div class="lr-title">{{ t.companyName }}</div>
          <div class="lr-sub">
            <span :class="['lr-tag', t.tradeType === 'SELL' ? 'sell' : 'buy']">
              #{{ t.tradeType === 'SELL' ? '매도' : '매수' }}
            </span>
            <span class="lr-memo">{{ Math.abs(t.quantity) }}주 · {{ won(t.tradePrice) }}원</span>
          </div>
        </div>

        <div class="lr-amount">
          <div
            :class="[
              'lr-delta',
              t.tradeType === 'SELL' ? 'plus' : 'minus',
              { pending: isPending(t) },
            ]"
          >
            {{ t.tradeType === 'SELL' ? '+' : '−' }}{{ won(t.totalAmount) }}원
          </div>

          <!-- 정산 예정 매도: 잔액 대신 입금예정일 -->
          <div v-if="isPending(t)" class="lr-settle">
            정산예정 · {{ formatMonthDay(t.settleDate) }} 입금
          </div>
          <!-- 매수 / 정산 완료 매도: 거래 후 잔액 -->
          <div v-else class="lr-balance">{{ won(t.remainingBalance) }}원</div>
        </div>
      </article>
    </div>

    <div class="bottom-spacer" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { tradesApi } from '@/api/trades'
import { userApi } from '@/api/user'

const router = useRouter()
const trades = ref([])
const balance = ref(0)
const loading = ref(false)
const error = ref(false)
const period = ref('1m')

const periods = [
  { label: '1개월', value: '1m' },
  { label: '3개월', value: '3m' },
  { label: '전체', value: 'all' },
]

// 기간 필터 + 최신순
const filtered = computed(() => {
  let list = [...trades.value]
  if (period.value !== 'all') {
    const months = period.value === '1m' ? 1 : 3
    const from = new Date()
    from.setMonth(from.getMonth() - months)
    list = list.filter((t) => new Date(t.tradeAt) >= from)
  }
  return list.sort((a, b) => new Date(b.tradeAt) - new Date(a.tradeAt))
})

// 기간 내 순합계 (매도 +, 매수 −)
const periodNet = computed(() =>
  filtered.value.reduce(
    (sum, t) => sum + (t.tradeType === 'SELL' ? t.totalAmount : -t.totalAmount),
    0,
  ),
)

async function load() {
  loading.value = true
  error.value = false
  try {
    const [histRes, meRes] = await Promise.all([tradesApi.getTradeHistory(), userApi.getMe()])
    trades.value = histRes.data
    balance.value = meRes.data.balance
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}
function isPending(t) {
  return t.tradeType === 'SELL' && t.settlementStatus === 'PENDING'
}
function formatMonthDay(d) {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getMonth() + 1}/${dt.getDate()}`
}

function goTradeDetail(tid) {
  router.push({ name: 'trade-detail', params: { tid } })
}
function goPortfolio() {
  router.push({ name: 'portfolio' })
}
function goMarket() {
  router.push({ name: 'market' })
}

function won(n) {
  return Number(n ?? 0).toLocaleString('ko-KR')
}
function signed(n) {
  const sign = n >= 0 ? '+' : '−'
  return `${sign}${Math.abs(n).toLocaleString('ko-KR')}`
}
function formatDay(value) {
  const formatdays = { 0: '일', 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토' }
  return formatdays[value]
}
function formatDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}(${formatDay(d.getDay())}) ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(load)
</script>

<style scoped>
.history-page {
  color: #1e1a2e;
  padding-bottom: 24px;
}

/* 상단 컬러 헤더 */
.balance-header {
  background: linear-gradient(135deg, #8b6dff, #7c5cff);
  color: #fff;
  padding: 20px 22px 22px;
  border-radius: 0 0 24px 24px;
}
.bh-label {
  font-size: 13px;
  font-weight: 600;
  opacity: 0.9;
}
.bh-value {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}
.bh-unit {
  font-size: 18px;
  font-weight: 700;
  margin-left: 3px;
}
.bh-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}
.bh-btn {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  border: none;
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}
.bh-btn:active {
  background: rgba(255, 255, 255, 0.32);
}

/* 기간 필터 */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 10px;
}
.period-pills {
  display: flex;
  gap: 6px;
}
.period-pill {
  padding: 6px 12px;
  border-radius: 9999px;
  border: 1px solid #e5e2ec;
  background: #fff;
  font-size: 13px;
  font-weight: 700;
  color: #6b6577;
  cursor: pointer;
}
.period-pill.active {
  background: #1e1a2e;
  border-color: #1e1a2e;
  color: #fff;
}
.sort-label {
  font-size: 13px;
  font-weight: 600;
  color: #a8a2b5;
}

/* 기간 내 합계 */
.period-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #efedf4;
}
.ps-label {
  font-size: 14px;
  font-weight: 700;
  color: #4a4459;
}
.ps-total {
  font-size: 15px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.ps-total.plus {
  color: #1e6ef4;
}
.ps-total.minus {
  color: #1e1a2e;
}

/* 거래 리스트 */
.ledger-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid #f3f1f8;
  cursor: pointer;
}
.ledger-row:active {
  background: #faf9fd;
}
.lr-date {
  font-size: 11px;
  font-weight: 600;
  color: #a8a2b5;
  width: 40px;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.lr-main {
  flex: 1 0 0;
  min-width: 0;
  padding: 0px 10px;
}
.lr-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lr-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}
.lr-tag {
  font-size: 12px;
  font-weight: 700;
}
.lr-tag.buy {
  color: #e53935;
}
.lr-tag.sell {
  color: #1e6ef4;
}
.lr-memo {
  font-size: 12px;
  font-weight: 500;
  color: #a8a2b5;
  font-variant-numeric: tabular-nums;
}
.lr-amount {
  text-align: right;
  flex-shrink: 0;
}
.lr-delta {
  font-size: 15px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.lr-delta.minus {
  color: #1e1a2e;
}
.lr-delta.plus {
  color: #1e6ef4;
}
.lr-balance {
  font-size: 12px;
  font-weight: 600;
  color: #b5b0c2;
  margin-top: 3px;
  font-variant-numeric: tabular-nums;
}
/* 정산 전 매도금액은 흐리게 — "아직 안 들어옴" 신호 */
.lr-delta.pending {
  color: #b0aab8;
}
.lr-settle {
  font-size: 10px;
  font-weight: 600;
  color: #e53935;
}
/* 상태 */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 70px 20px;
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
.bottom-spacer {
  height: 24px;
}
</style>
