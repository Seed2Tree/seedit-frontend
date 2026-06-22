<template>
  <div class="diary-page">

    <!-- 헤더 -->
    <div class="diary-header">
      <h1 class="page-title">투자일지</h1>
      <span class="diary-count">이번 달 {{ thisMonthCount }}개 기록</span>
    </div>

    <!-- 캘린더 -->
    <div class="calendar-wrap">
      <div class="calendar-nav">
        <button class="nav-btn" @click="changeMonth(-1)">&#8249;</button>
        <span class="cal-title">{{ calYear }}년 {{ calMonth }}월</span>
        <button class="nav-btn" @click="changeMonth(1)">&#8250;</button>
      </div>

      <!-- 요일 헤더 -->
      <div class="weekdays">
        <span v-for="d in ['일','월','화','수','목','금','토']" :key="d">{{ d }}</span>
      </div>

      <!-- 날짜 그리드 -->
      <div class="dates-grid">
        <div
          v-for="cell in calendarCells"
          :key="cell.key"
          :class="['date-cell', {
            empty: !cell.date,
            today: cell.isToday,
            sunday: cell.isSunday,
            saturday: cell.isSaturday,
          }]"
          @click="cell.date && goToDetail(cell.dateStr)"
        >
          <span v-if="cell.date" class="date-num">{{ cell.date }}</span>
          <div v-if="cell.date" class="dots">
            <span v-if="cell.dots.hasBuy"  class="dot buy" />
            <span v-if="cell.dots.hasSell" class="dot sell" />
            <span v-if="cell.dots.hasDiary" class="dot diary" />
          </div>
        </div>
      </div>

      <!-- 도트 범례 -->
      <div class="dot-legend">
        <span class="legend-item"><span class="dot buy" />매수</span>
        <span class="legend-item"><span class="dot sell" />매도</span>
        <span class="legend-item"><span class="dot diary" />일지</span>
      </div>
    </div>

    <!-- 목록 -->
    <div class="list-header">일지 목록</div>

    <div v-if="store.isLoading" class="state-box">
      <div class="spinner" />
    </div>

    <div v-else-if="groupedList.length === 0" class="state-box empty">
      <p>기록이 없어요</p>
    </div>

    <ul v-else class="diary-list">
      <li
        v-for="group in groupedList"
        :key="group.dateStr"
        class="diary-item"
        @click="goToDetail(group.dateStr)"
      >
        <!-- 날짜 헤더 -->
        <div class="group-date">{{ formatDate(group.dateStr) }}</div>

        <!-- 거래 요약 -->
        <div v-if="group.trades.length > 0" class="group-trades">
          <div v-for="t in group.trades" :key="t.tid" class="trade-row">
            <span :class="['trade-badge', t.tradeType === 'BUY' ? 'buy' : 'sell']">
              {{ t.tradeType === 'BUY' ? '매수' : '매도' }}
            </span>
            <span class="trade-company">{{ t.companyName }}</span>
            <span class="trade-amount">
              {{ t.tradeType === 'SELL' ? '-' : '' }}{{ Math.abs(t.quantity) }}주 · {{ formatAmount(t.totalAmount) }}
            </span>
          </div>
        </div>

        <!-- 일지 미리보기 -->
        <div v-if="group.diary?.contentPreview" class="group-diary">
          📝 {{ group.diary.contentPreview }}
        </div>
      </li>
    </ul>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'

const router = useRouter()
const store = useDiaryStore()

// 캘린더 상태
const now = new Date()
const calYear  = ref(now.getFullYear())
const calMonth = ref(now.getMonth() + 1) // 1-based

function changeMonth(delta) {
  let m = calMonth.value + delta
  let y = calYear.value
  if (m < 1)  { m = 12; y-- }
  if (m > 12) { m = 1;  y++ }
  calMonth.value = m
  calYear.value  = y
  store.fetchCalendar(y, m)
}

// 캘린더 셀 계산
const calendarCells = computed(() => {
  const y = calYear.value
  const m = calMonth.value
  const firstDay = new Date(y, m - 1, 1).getDay() // 0=일
  const lastDate  = new Date(y, m, 0).getDate()
  const todayStr  = toDateStr(new Date())

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push({ key: `e${i}`, date: null })
  for (let d = 1; d <= lastDate; d++) {
    const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const tradeDots = store.tradeDotsFor(dateStr) ?? {}
    cells.push({
      key: dateStr,
      date: d,
      dateStr,
      isToday: dateStr === todayStr,
      isSunday:   (firstDay + d - 1) % 7 === 0,
      isSaturday: (firstDay + d - 1) % 7 === 6,
      dots: {
        hasBuy:   tradeDots.hasBuy  ?? false,
        hasSell:  tradeDots.hasSell ?? false,
        hasDiary: store.hasDiary(dateStr),
      },
    })
  }
  return cells
})

const thisMonthCount = computed(() => {
  const prefix = `${calYear.value}-${String(calMonth.value).padStart(2,'0')}`
  return store.diaryCalendarDates.filter((d) => d.startsWith(prefix)).length
})

// 날짜별 그룹핑 (최신순)
const groupedList = computed(() => {
  const map = new Map()

  for (const d of store.diaryList) {
    if (!map.has(d.diaryDate)) map.set(d.diaryDate, { dateStr: d.diaryDate, diary: null, trades: [] })
    map.get(d.diaryDate).diary = d
  }

  for (const t of store.tradeList) {
    const dateStr = t.tradeAt?.slice(0, 10)
    if (!dateStr) continue
    if (!map.has(dateStr)) map.set(dateStr, { dateStr, diary: null, trades: [] })
    map.get(dateStr).trades.push(t)
  }

  return [...map.values()].sort((a, b) => b.dateStr.localeCompare(a.dateStr))
})

function goToDetail(dateStr) {
  router.push({ name: 'diary-detail', params: { date: dateStr } })
}

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  const dayNames = ['일','월','화','수','목','금','토']
  const day = new Date(+y, +m - 1, +d).getDay()
  return `${+m}월 ${+d}일 (${dayNames[day]})`
}

function formatAmount(amount) {
  if (!amount) return ''
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`
  if (amount >= 10000) return `${Math.round(amount / 10000)}만원`
  return `${amount.toLocaleString()}원`
}

onMounted(async () => {
  await Promise.all([
    store.fetchList(),
    store.fetchCalendar(calYear.value, calMonth.value),
    store.fetchTradeList(),
  ])
})
</script>

<style scoped>
.diary-page {
  padding: 0 0 80px;
  background: #fff;
  min-height: 100vh;
}

.diary-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 20px 20px 12px;
}
.page-title { font-size: 22px; font-weight: 700; color: #111; margin: 0; }
.diary-count { font-size: 13px; color: #888; }

/* 캘린더 */
.calendar-wrap { padding: 0 16px 8px; }
.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.nav-btn { background: none; border: none; font-size: 22px; color: #555; cursor: pointer; padding: 4px 8px; }
.cal-title { font-size: 15px; font-weight: 600; color: #111; }

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 4px;
}
.weekdays span { font-size: 11px; color: #aaa; padding: 2px 0; }

.dates-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.date-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 0 6px;
  border-radius: 8px;
  cursor: pointer;
  min-height: 44px;
}
.date-cell.empty { cursor: default; }
.date-cell:not(.empty):hover { background: #f5f5f5; }
.date-cell.today .date-num {
  background: rgba(124, 92, 255, 0.4);
  color: #fff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.date-num { font-size: 13px; color: #222; line-height: 24px; min-width: 24px; text-align: center; }
.date-cell.sunday .date-num  { color: #E53935; }
.date-cell.saturday .date-num { color: #1E6EF4; }

.dots { display: flex; gap: 2px; margin-top: 2px; }
.dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.dot.buy   { background: #E53935; }
.dot.sell  { background: #1E6EF4; }
.dot.diary { background: #4CAF50; }

/* 도트 범례 */
.dot-legend {
  display: flex;
  gap: 16px;
  padding: 10px 4px 4px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #888;
}
.legend-item .dot {
  width: 7px;
  height: 7px;
}

/* 상태 */
.state-box { display: flex; justify-content: center; align-items: center; padding: 48px 0; }
.state-box.empty { color: #aaa; font-size: 14px; }
.spinner {
  width: 28px; height: 28px;
  border: 3px solid #eee;
  border-top-color: #7C5CFF;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 목록 */
.list-header {
  padding: 20px 16px 8px;
  font-size: 15px;
  font-weight: 700;
  color: #111;
  background: #f6f4ff;
}
.diary-list { list-style: none; margin: 0; padding: 0 16px; display: flex; flex-direction: column; gap: 10px; padding-bottom: 20px; background: #f6f4ff;; }
.diary-item {
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  padding: 14px 16px;
  cursor: pointer;
  background: #fff;
}
.diary-item:hover { background: #fafafa; }

/* 날짜 헤더 */
.group-date {
  font-size: 14px;
  font-weight: 700;
  color: #111;
  margin-bottom: 10px;
}

/* 거래 행 */
.group-trades { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
.trade-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.trade-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  flex-shrink: 0;
}
.trade-badge.buy  { background: #fdecea; color: #E53935; }
.trade-badge.sell { background: #e8effe; color: #1E6EF4; }
.trade-company { font-size: 13px; font-weight: 600; color: #222; flex: 1; }
.trade-amount  { font-size: 13px; color: #555; flex-shrink: 0; }

/* 일지 미리보기 */
.group-diary {
  font-size: 12px;
  color: #888;
  padding-top: 8px;
  border-top: 1px solid #f5f5f5;
  margin-top: 4px;
}
</style>
