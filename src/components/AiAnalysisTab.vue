<template>
  <div class="ai-tab">
    <!-- 필터: 연도 + 보고서 종류 -->
    <div class="filter-row">
      <select v-model.number="bsnsYear" class="filter-select">
        <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년</option>
      </select>
      <select v-model="reprtCode" class="filter-select">
        <option v-for="r in reprtOptions" :key="r.value" :value="r.value">{{ r.label }}</option>
      </select>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="state-box">
      <div class="spinner" />
      <p>분석을 불러오는 중...</p>
    </div>

    <!-- 생성 중 -->
    <div v-else-if="generating" class="state-box">
      <div class="spinner" />
      <p>AI가 재무제표를 분석하고 있어요...</p>
      <p class="sub">최대 30초 정도 걸릴 수 있어요</p>
    </div>

    <!-- 에러 -->
    <div v-else-if="error" class="state-box">
      <p>⚠️ {{ error }}</p>
      <button class="ghost-btn" @click="load">다시 시도</button>
    </div>

    <!-- 없음 → 생성 유도 -->
    <div v-else-if="!report" class="state-box empty">
      <p>아직 이 분기의 AI 분석이 없어요.</p>
      <button class="primary-btn" @click="generate">AI 분석 생성하기</button>
    </div>

    <!-- 리포트 본문 -->
    <template v-else>
      <p class="disclaimer">
        본 자료는 제공된 데이터에 기반한 경제 공부용 정보이며, 투자 권유·자문이 아닙니다.
      </p>

      <section class="card">
        <h3 class="card-title">💰 수익성</h3>
        <p>{{ report.profitability_comment }}</p>
      </section>

      <section class="card">
        <h3 class="card-title">🏦 안정성</h3>
        <p>{{ report.stability_comment }}</p>
      </section>

      <section class="card">
        <h3 class="card-title">
          💸 현금흐름
          <span class="badge">{{ report.cashflow_stage }}</span>
        </h3>
        <p>{{ report.cashflow_comment }}</p>
      </section>

      <section class="card">
        <h3 class="card-title">📊 주가 지표</h3>
        <p>{{ report.valuation_comment }}</p>
      </section>

      <section class="card good">
        <h3 class="card-title">👍 재무적 강점</h3>
        <ul>
          <li v-for="(s, i) in report.strengths" :key="i">{{ s }}</li>
        </ul>
      </section>
      <section class="card risk">
        <h3 class="card-title">⚠️ 눈여겨볼 점</h3>
        <ul>
          <li v-for="(r, i) in report.risks" :key="i">{{ r }}</li>
        </ul>
      </section>

      <div class="footer-row">
        <span v-if="!loading && createdAt" class="meta"
          >분석 생성: {{ formatDate(createdAt) }}</span
        >
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { reportApi } from '@/api/report'

const props = defineProps({ ticker: { type: String, required: true } })

const REPRT_LABEL = { 11011: '사업보고서(연간)', 11014: '3분기', 11012: '반기', 11013: '1분기' }
const REPRT_ORDER = ['11011', '11014', '11012', '11013']

const available = ref([]) // [{ bsnsYear, reprtCode, reportNm }]
const bsnsYear = ref(null)
const reprtCode = ref(null)
const report = ref(null)
const createdAt = ref(null)
const loading = ref(false)
const generating = ref(false)
const error = ref('')

// 실제 데이터가 있는 연도만 (내림차순)
const yearOptions = computed(() =>
  [...new Set(available.value.map((a) => a.bsnsYear))].sort((a, b) => b - a),
)
// 선택된 연도에 존재하는 보고서 종류만
const reprtOptions = computed(() =>
  available.value
    .filter((a) => a.bsnsYear === bsnsYear.value)
    .map((a) => ({ value: a.reprtCode, label: REPRT_LABEL[a.reprtCode] ?? a.reprtCode }))
    .sort((a, b) => REPRT_ORDER.indexOf(a.value) - REPRT_ORDER.indexOf(b.value)),
)

async function initOptions() {
  try {
    const res = await reportApi.getAvailable(props.ticker)
    available.value = res.data ?? []
  } catch {
    available.value = []
  }
  if (!available.value.length) {
    error.value = '조회 가능한 공시 데이터가 없어요'
    return
  }
  bsnsYear.value = yearOptions.value[0]
  reprtCode.value = reprtOptions.value[0]?.value ?? null
  await load()
}

// 연도가 바뀌면 그 연도에 없는 보고서코드는 보정
watch(bsnsYear, () => {
  if (!reprtOptions.value.some((r) => r.value === reprtCode.value)) {
    reprtCode.value = reprtOptions.value[0]?.value ?? null
  }
})

watch([bsnsYear, reprtCode], () => {
  if (bsnsYear.value && reprtCode.value) load()
})

onMounted(initOptions)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await reportApi.get(props.ticker, bsnsYear.value, reprtCode.value)
    const data = res.data // 없으면 null
    report.value = data ? data.report : null
    createdAt.value = data ? data.createdAt : null
  } catch {
    error.value = '분석을 불러오지 못했어요'
    report.value = null
  } finally {
    loading.value = false
  }
}

async function generate() {
  generating.value = true
  error.value = ''
  try {
    const res = await reportApi.generate(props.ticker, bsnsYear.value, reprtCode.value)
    const data = res.data
    report.value = data ? data.report : null
    createdAt.value = data ? data.createdAt : null
  } catch (e) {
    error.value =
      e?.response?.data?.error?.message ?? 'AI 분석 생성에 실패했어요 (데이터가 없을 수 있어요)'
  } finally {
    generating.value = false
  }
}

function formatDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
}
</script>

<style scoped>
.ai-tab {
  padding: 12px;
}
.filter-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.filter-select {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
}
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 16px;
  color: #666;
  text-align: center;
}
.state-box .sub {
  font-size: 12px;
  color: #999;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #eee;
  border-top-color: #7c5cff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.disclaimer {
  font-size: 11px;
  padding: 0px 5px;
  color: #e53935;
  font-weight: 700;
  line-height: 1.5;
  margin-bottom: 10px;
}
.card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
}
.card-title {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.card p {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin: 0;
}
.badge {
  font-size: 11px;
  font-weight: 600;
  background: #e8f5e9;
  color: #2e7d32;
  padding: 2px 8px;
  border-radius: 999px;
}
.two-col {
  display: flex;
  gap: 10px;
}
.two-col .card {
  flex: 1;
}
.card ul {
  margin: 0;
  padding-left: 18px;
}
.card li {
  font-size: 13px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 4px;
}
.card.good {
  border-color: #c8e6c9;
}
.card.risk {
  border-color: #ffe0b2;
}
.footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}
.meta {
  font-size: 12px;
  color: #999;
}
.primary-btn {
  padding: 12px 20px;
  background: #7c5cff;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.ghost-btn {
  padding: 8px 14px;
  background: transparent;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 13px;
  color: #555;
  cursor: pointer;
}
</style>
