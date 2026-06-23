<template>
  <div class="home">
    <!-- 인사 -->
    <div class="greeting-label">🌱 {{ user.day }}일차 {{ level.levelName || '새싹이' }}</div>
    <h1 class="greeting-title">오늘도 한 뼘 자라볼까요?</h1>

    <!-- 레벨 카드 -->
    <div class="level-card">
      <div class="level-mascot">🍊</div>
      <div class="level-body">
        <div class="level-tier">Lv. {{ level.level }} · {{ level.levelName || '새싹이' }}</div>
        <div class="level-msg">잘 자라고 있어요!</div>
        <div class="level-progress">
          <div class="level-track">
            <div class="level-fill" :style="{ width: progressPercent + '%' }" />
          </div>
          <span class="level-percent">{{ progressPercent }}%</span>
        </div>
      </div>
    </div>

    <!-- 내 모의자산 -->
    <div class="asset-card" @click="goHistory">
      <div class="asset-label">내 모의자산</div>
      <div class="asset-value">{{ won(user.balance) }}원</div>
      <div class="asset-sub">
        <span v-if="weeklyReturn != null" :class="['asset-rate', { down: weeklyReturn < 0 }]">
          {{ formatRate(weeklyReturn) }}
        </span>
        <span class="asset-caption">지난주 대비</span>
      </div>
      <div class="asset-actions">
        <button class="asset-btn ghost" @click.stop="goPortfolio">보유종목</button>
        <button class="asset-btn solid" @click.stop="goDiary">일지 쓰기</button>
      </div>
    </div>

    <!-- 오늘의 투자 운세 -->
    <div class="fortune-card">
      <div class="fortune-head">
        <span class="fortune-head-title">🔮 오늘의 투자 운세</span>
        <span class="fortune-date">{{ todayLabel }}</span>
      </div>
      <div class="fortune-body">
        <div class="fortune-icon">{{ fortune.emoji }}</div>
        <div class="fortune-text">
          <div class="fortune-title">{{ fortune.title }}</div>
          <p class="fortune-desc">{{ fortune.desc }}</p>
        </div>
      </div>
    </div>

    <!-- 오늘의 일지 -->
    <div class="diary-section">
      <div class="section-head">
        <h2 class="section-title">오늘의 일지</h2>
        <button class="view-all" @click="goDiary">전체보기</button>
      </div>

      <div v-if="store.isLoading" class="state-box">
        <div class="spinner" />
      </div>

      <div v-else-if="todayGroup" class="diary-item" @click="goToDetail(todayGroup.dateStr)">
        <div class="group-date">{{ formatDate(todayGroup.dateStr) }}</div>

        <div v-if="todayGroup.trades.length > 0" class="group-trades">
          <div v-for="t in todayGroup.trades" :key="t.tid" class="trade-row">
            <span :class="['trade-badge', t.tradeType === 'BUY' ? 'buy' : 'sell']">
              {{ t.tradeType === 'BUY' ? '매수' : '매도' }}
            </span>
            <span class="trade-company">{{ t.companyName }}</span>
            <span class="trade-amount">
              {{ t.tradeType === 'SELL' ? '-' : '' }}{{ Math.abs(t.quantity) }}주 ·
              {{ formatAmount(t.totalAmount) }}
            </span>
          </div>

          <div v-if="todayGroup.diary" class="group-diary">📝 {{ todayGroup.diary }}</div>
        </div>
      </div>

      <div v-else class="diary-empty empty">
        <p>오늘 작성한 일지나 거래 기록이 없어요.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'
import { userApi } from '@/api/user'
import { diaryApi } from '@/api/diary'

const router = useRouter()
const store = useDiaryStore()

// --- 상태 ---
const user = ref({ name: '', day: 0, balance: 0 })
const level = ref({ level: 1, levelName: '', point: 0 })
const weeklyReturn = ref(null) // 지난주 대비 수익률(%)
const diaries = ref([])

// --- 레벨 진행도 ---
const progressPercent = computed(() =>
  Math.min(100, Math.round((level.value.point / (level.value.nextLevelPoint || 1)) * 100)),
)

// --- 오늘 날짜 ---
const todayLabel = computed(() => {
  const d = new Date()
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
})

// --- 오늘의 투자 운세 (로컬) ---
// TODO: AI 운세 엔드포인트 생기면 교체. 지금은 날짜 기반으로 고정 선택해 하루 동안 동일하게 표시.
const fortunePool = [
  {
    emoji: '🌿',
    title: '관찰의 날',
    desc: '급한 결정보다 한 발 떨어져 차트를 들여다보면 좋은 날. 관심 종목에 가설을 한 줄씩 메모해두세요.',
  },
  {
    emoji: '🌤️',
    title: '인내의 날',
    desc: '오늘은 사고파는 것보다 기다림이 어울려요. 세워둔 가설이 맞는지 천천히 확인해보세요.',
  },
  {
    emoji: '🔥',
    title: '점검의 날',
    desc: '보유 종목의 매수 이유를 다시 떠올려볼 시간. 흔들리는 마음을 기록으로 붙잡아두세요.',
  },
  {
    emoji: '💧',
    title: '비움의 날',
    desc: '욕심을 한 스푼 덜어내기 좋은 날. 수익이 났다면 일부 익절도 나쁘지 않아요.',
  },
]
const fortune = computed(() => {
  const d = new Date()
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000)
  return fortunePool[dayOfYear % fortunePool.length]
})

// --- 포맷 ---
function won(n) {
  return Number(n ?? 0).toLocaleString('ko-KR')
}
function formatRate(rate) {
  if (rate == null) return '-'
  const sign = rate >= 0 ? '+' : '−'
  return `${sign}${Math.abs(rate).toFixed(2)}%`
}
function formatTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `오늘 ${hh}:${mm}`
}

// --- 라우팅 ---
function goPortfolio() {
  router.push({ name: 'portfolio' })
}
function goDiary() {
  router.push({ name: 'diary' })
}
function goHistory() {
  router.push({ name: 'trade-history' })
}

// --- 데이터 로드 ---
onMounted(async () => {
  // 사용자 정보: 자산 / 레벨 (ProfileView와 동일 방식)
  try {
    const res = await userApi.getMe()
    const u = res.data
    const created = new Date(u.createdAt)
    const dayCount = Math.floor((Date.now() - created.getTime()) / 86400000) + 1
    user.value = { name: u.username, balance: u.balance, day: dayCount }
    level.value = {
      level: u.level.level,
      levelName: u.level.levelName,
      point: u.level.point,
      nextLevelPoint: u.level.nextLevelPoint,
    }
    // TODO: 지난주 대비 수익률은 별도 소스 필요 (예: 포트폴리오 요약 / balance-histories)
    weeklyReturn.value = u.weeklyReturnRate ?? null
  } catch (e) {
    // 사용자 정보 로드 실패
  }
})

// --- 1. 데이터 패치 함수 (비동기) ---
async function fetchTodayData() {
  try {
    const offset = new Date().getTimezoneOffset() * 60000
    const todayStr = new Date(Date.now() - offset).toISOString().slice(0, 10)

    // API 호출 후 state에 저장
    const res = await diaryApi.getByDate(todayStr)
    diaries.value = Array.isArray(res.data) ? res.data : (res.data?.content ?? [])
  } catch (e) {
    diaries.value = []
  }
}

// --- 2. 화면 표시용 데이터 가공 (동기 계산) ---
const todayGroup = computed(() => {
  const offset = new Date().getTimezoneOffset() * 60000
  const todayStr = new Date(Date.now() - offset).toISOString().slice(0, 10)

  // diaries.value나 store.tradeList가 바뀔 때마다 자동으로 실행됨
  const todayDiary = diaries.value
  const todayTrades = store.tradeList.filter((t) => t.tradeAt?.slice(0, 10) === todayStr)

  // 데이터가 아예 없으면 null 반환
  if ((!todayDiary || todayDiary.length === 0) && todayTrades.length === 0) {
    return null
  }

  return {
    dateStr: todayStr,
    diary: todayDiary,
    trades: todayTrades,
  }
})

function goToDetail(dateStr) {
  router.push({ name: 'diary-detail', params: { date: dateStr } })
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
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
  try {
    await Promise.all([store.fetchTradeList(), fetchTodayData()])
  } catch (e) {
    console.error('데이터 로드 실패:', e)
  }
})
</script>

<style scoped>
.home {
  padding: 8px 20px 24px;
  font-family: Pretendard;
  color: #1e1a2e;
}

/* 인사 */
.greeting-label {
  font-size: 13px;
  font-weight: 700;
  color: #4fae6b;
  margin-top: 4px;
}
.greeting-title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 6px 0 18px;
}

/* 레벨 카드 */
.level-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #f4f1ff;
  border-radius: 18px;
  padding: 16px 18px;
}
.level-mascot {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
}
.level-body {
  flex: 1 0 0;
  min-width: 0;
}
.level-tier {
  font-size: 12px;
  font-weight: 700;
  color: #7c5cff;
}
.level-msg {
  font-size: 15px;
  font-weight: 800;
  margin: 2px 0 10px;
}
.level-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}
.level-track {
  flex: 1 0 0;
  height: 8px;
  border-radius: 99px;
  background: #e2dbfa;
  overflow: hidden;
}
.level-fill {
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #7c5cff, #a78bfa);
  transition: width 0.3s ease;
}
.level-percent {
  font-size: 12px;
  font-weight: 800;
  color: #7c5cff;
  font-variant-numeric: tabular-nums;
}

/* 모의자산 카드 */
.asset-card {
  margin-top: 16px;
  border-radius: 20px;
  padding: 22px 20px;
  background: linear-gradient(135deg, #8b6dff, #7c5cff);
  color: #fff;
  box-shadow: 0 10px 24px rgba(124, 92, 255, 0.28);
  cursor: pointer;
  transition: transform 0.08s;
}
.asset-card:active {
  transform: scale(0.99);
}
.asset-label {
  font-size: 13px;
  font-weight: 600;
  opacity: 0.92;
}
.asset-value {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-top: 6px;
  font-variant-numeric: tabular-nums;
}
.asset-sub {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.asset-rate {
  font-size: 12px;
  font-weight: 800;
  background: rgba(255, 255, 255, 0.22);
  padding: 3px 9px;
  border-radius: 99px;
}
.asset-rate.down {
  background: rgba(30, 110, 244, 0.3);
}
.asset-caption {
  font-size: 12px;
  opacity: 0.85;
}
.asset-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}
.asset-btn {
  flex: 1 0 0;
  height: 46px;
  border-radius: 14px;
  border: none;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}
.asset-btn.ghost {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}
.asset-btn.solid {
  background: #fff;
  color: #7c5cff;
}

/* 운세 카드 */
.fortune-card {
  margin-top: 24px;
  border: 1px solid #efedf4;
  border-radius: 18px;
  padding: 18px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(124, 92, 255, 0.05);
}
.fortune-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.fortune-head-title {
  font-size: 15px;
  font-weight: 800;
}
.fortune-date {
  font-size: 12px;
  color: #a8a2b5;
  font-weight: 600;
}
.fortune-body {
  display: flex;
  gap: 12px;
  margin-top: 14px;
}
.fortune-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #f2f7f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.fortune-text {
  flex: 1 0 0;
}
.fortune-title {
  font-size: 15px;
  font-weight: 800;
  color: #1e1a2e;
}
.fortune-desc {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: #6b6577;
}

/* 상태 */
.state-box {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px 0;
}
.state-box.empty {
  color: #aaa;
  font-size: 14px;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #eee;
  border-top-color: #7c5cff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 목록 */
.list-header {
  padding: 20px 16px 8px;
  font-size: 15px;
  font-weight: 700;
  color: #111;
  background: #f6f4ff;
}
.diary-list {
  list-style: none;
  margin: 0;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 20px;
  border-radius: 14px;
  background: #f6f4ff;
}
.diary-item {
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  padding: 14px 16px;
  cursor: pointer;
  background: #fff;
}
.diary-item:hover {
  background: #fafafa;
}

/* 날짜 헤더 */
.group-date {
  font-size: 14px;
  font-weight: 700;
  color: #111;
  margin-bottom: 10px;
}

/* 거래 행 */
.group-trades {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}
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
.trade-badge.buy {
  background: #fdecea;
  color: #e53935;
}
.trade-badge.sell {
  background: #e8effe;
  color: #1e6ef4;
}
.trade-company {
  font-size: 13px;
  font-weight: 600;
  color: #222;
  flex: 1;
}
.trade-amount {
  font-size: 13px;
  color: #555;
  flex-shrink: 0;
}

/* 일지 미리보기 */
.group-diary {
  font-size: 12px;
  color: #888;
  padding-top: 8px;
  border-top: 1px solid #f5f5f5;
  margin-top: 4px;
}
/* 오늘의 일지 */
.diary-section {
  margin-top: 28px;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-title {
  font-size: 17px;
  font-weight: 800;
}
.view-all {
  background: none;
  border: none;
  font-size: 12px;
  color: #9a97ae;
  cursor: pointer;
  text-decoration: underline;
}
.diary-card {
  border: 1px solid #efedf4;
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  margin-bottom: 10px;
}
.diary-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.diary-tag {
  font-size: 12px;
  font-weight: 800;
}
.diary-tag.buy {
  color: #e53935;
}
.diary-tag.sell {
  color: #1e6ef4;
}
.diary-time {
  font-size: 12px;
  color: #a8a2b5;
  font-weight: 600;
}
.diary-excerpt {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #4a4459;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.diary-empty {
  border: 1px dashed #e4e2ed;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: #a8a2b5;
}
</style>
