<template>
  <div class="page">
    <div v-if="loading" class="state-box">불러오는 중…</div>
    <div v-else-if="error" class="state-box">
      거래 정보를 불러오지 못했어요.
      <button class="retry-btn" @click="load">다시 시도</button>
    </div>

    <div v-else-if="trade" class="content">
      <!-- 종목 + 매수/매도 -->
      <section class="card head-card">
        <div class="stock-line">
          <span class="stock-name">{{ trade.companyName }}</span>
          <span class="stock-ticker">{{ trade.ticker }}</span>
        </div>
        <span :class="['type-badge', isSell ? 'sell' : 'buy']">
          {{ isSell ? '매도' : '매수' }}
        </span>
      </section>

      <!-- 체결 정보 -->
      <section class="card">
        <div class="row">
          <span class="label">체결가</span><span class="value">{{ won(trade.tradePrice) }}원</span>
        </div>
        <div class="row">
          <span class="label">수량</span><span class="value">{{ Math.abs(trade.quantity) }}주</span>
        </div>
        <div class="row total">
          <span class="label">총 거래금액</span
          ><span class="value">{{ won(trade.totalAmount) }}원</span>
        </div>
        <div class="row">
          <span class="label">체결 시각</span
          ><span class="value">{{ formatDateTime(trade.tradeAt) }}</span>
        </div>
      </section>

      <!-- 정산 상태 (매도만) -->
      <section v-if="isSell && trade.settlementStatus" class="card settle-card">
        <div class="row">
          <span class="label">정산 상태</span>
          <span :class="['settle-badge', isPending ? 'pending' : 'done']">
            {{ isPending ? '정산 예정' : '입금 완료' }}
          </span>
        </div>
        <div v-if="isPending" class="row">
          <span class="label">입금 예정일</span>
          <span class="value"
            >{{ trade.settleDate }} <em class="dday">D-{{ dday }}</em></span
          >
        </div>
        <p v-if="isPending" class="settle-hint">매도대금은 영업일 +2일 뒤 예수금으로 입금돼요.</p>
      </section>

      <!-- 이 매도에서 체결한 가설 -->
      <section v-if="isSell && verifiedReasons.length" class="card">
        <h2 class="card-title">이 매도에서 체결한 가설</h2>
        <div v-for="r in verifiedReasons" :key="r.rid" class="verified-reason">
          <span class="reason-tag">
            {{ tagEmoji(r.reasonTag) }} {{ tagLabel(r.reasonTag) }} <em class="check">✓</em>
          </span>
          <p v-if="r.reasonText" class="reason-text">{{ r.reasonText }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tradesApi } from '@/api/trades'
import { tagLabel, tagEmoji } from '@/constants/reasonTags'

const route = useRoute()

const trade = ref(null)
const loading = ref(false)
const error = ref(false)
const verifiedReasons = ref([])
const isSell = computed(() => trade.value?.tradeType === 'SELL')
const isPending = computed(() => trade.value?.settlementStatus === 'PENDING')

// 입금 예정일까지 남은 일수(달력 기준 표시용)
const dday = computed(() => {
  if (!trade.value?.settleDate) return 0
  const diff = new Date(trade.value.settleDate) - new Date()
  return Math.max(0, Math.ceil(diff / 86400000))
})

function won(n) {
  return Number(n ?? 0).toLocaleString('ko-KR')
}
function formatDateTime(s) {
  if (!s) return '-'
  const d = new Date(s)
  return (
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ` +
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  )
}

async function load() {
  loading.value = true
  error.value = false
  try {
    const res = await tradesApi.getTradeHistoryById(route.params.tid)
    trade.value = res.data.trade // ← .trade 추가
    verifiedReasons.value = res.data.verifiedReasons ?? []
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f6f6f8;
  color: #1e1a2e;
  font-family: Pretendard;
}
.topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: #fff;
  position: sticky;
  top: 0;
}
.back-btn {
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
  line-height: 1;
  color: #1e1a2e;
}
.topbar-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}
.content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.state-box {
  padding: 60px 20px;
  text-align: center;
  color: #888;
}
.retry-btn {
  display: block;
  margin: 12px auto 0;
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}

.card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
}
.head-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.stock-line {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stock-name {
  font-size: 17px;
  font-weight: 700;
}
.stock-ticker {
  font-size: 13px;
  color: #999;
}
.type-badge {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}
.type-badge.buy {
  background: #fdecec;
  color: #e5484d;
}
.type-badge.sell {
  background: #e8f0fe;
  color: #1a73e8;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 0;
  font-size: 14px;
}
.row .label {
  color: #888;
}
.row .value {
  font-weight: 600;
}
.row.total {
  border-top: 1px solid #f0f0f0;
  margin-top: 4px;
  padding-top: 11px;
}
.row.total .value {
  font-size: 16px;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 10px;
}
.settle-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}
.settle-badge.pending {
  background: #fff4e5;
  color: #d9822b;
}
.settle-badge.done {
  background: #e7f6ec;
  color: #1f9d55;
}
.dday {
  font-style: normal;
  color: #e5484d;
  font-weight: 700;
  margin-left: 4px;
}
.settle-hint {
  font-size: 12px;
  color: #999;
  margin: 8px 0 0;
}

.reason-tag {
  display: inline-block;
  padding: 6px 12px;
  background: #f1eefb;
  color: #6c4ed9;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
}
.reason-text {
  font-size: 14px;
  line-height: 1.6;
  color: #444;
  margin: 0;
  white-space: pre-wrap;
}
/* 검증 완료 배지 */
.verified-badge {
  display: inline-block;
  margin-bottom: 10px;
  margin-right: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #eaf7ef;
  color: #1f9d55;
  font-size: 13px;
  font-weight: 700;
}
.verified-reason {
  padding: 8px 0;
}
.verified-reason + .verified-reason {
  border-top: 1px solid #f0f0f0;
}
.verified-reason .check {
  font-style: normal;
  color: #1f9d55;
  font-weight: 700;
  margin-left: 4px;
}
</style>
