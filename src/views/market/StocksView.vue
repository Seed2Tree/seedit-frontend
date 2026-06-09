<template>
  <div class="market-page">

    <!-- 헤더 -->
    <div class="market-header">
      <div class="page-title">투자종목</div>
      <div class="page-subtitle">관심 종목을 찾아보세요</div>

      <!-- 검색창 -->
      <div class="search-wrap">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          v-model="query"
          class="search-input"
          type="text"
          placeholder="종목명 또는 코드 검색"
          @input="onSearch"
        />
        <button v-if="query" class="search-clear" @click="query = ''">✕</button>
      </div>

      <!-- 필터 탭: 전체 / 관심종목 -->
      <div v-if="!query" class="filter-tabs">
        <button
          :class="['filter-tab', { active: filter === 'all' }]"
          @click="filter = 'all'"
        >전체</button>
        <button
          :class="['filter-tab', { active: filter === 'watchlist' }]"
          @click="filter = 'watchlist'"
        >⭐ 관심종목</button>
      </div>
    </div>

    <!-- 로딩 -->
    <div v-if="marketStore.isLoading" class="state-box">
      <div class="spinner" />
      <p>종목 불러오는 중...</p>
    </div>

    <!-- 에러 -->
    <div v-else-if="marketStore.error" class="state-box">
      <p>⚠️ 종목을 불러오지 못했어요</p>
      <button class="retry-btn" @click="marketStore.fetchList()">다시 시도</button>
    </div>

    <template v-else>
      <!-- 검색 결과 없음 -->
      <div v-if="filteredStocks.length === 0" class="state-box">
        <p>{{ query ? `'${query}' 검색 결과가 없어요` : '관심종목이 없어요' }}</p>
      </div>

      <div v-else>
        <!-- 오늘 급등 TOP 3 (검색·관심종목 필터 아닐 때만) -->
        <div v-if="!query && filter === 'all'" class="section">
          <div class="section-label">🔥 오늘 가장 많이 오른 종목</div>
          <div class="trending-list">
            <button
              v-for="stock in marketStore.trendingStocks"
              :key="stock.sid"
              class="trending-card"
              @click="goDetail(stock)"
            >
              <div class="stock-avatar" :style="{ background: stock.color || '#7C5CFF' }">
                {{ stock.companyName.slice(0, 2) }}
              </div>
              <div class="trending-name">{{ stock.companyName }}</div>
              <div class="trending-code">{{ stock.ticker }}</div>
              <div class="change-rate gain">{{ formatRate(stock.changeRate) }}</div>
            </button>
          </div>
        </div>

        <!-- 종목 리스트 -->
        <div class="section">
          <div class="section-label">
            {{ query ? `'${query}' 검색 결과` : filter === 'watchlist' ? '관심종목' : '전체 종목' }}
          </div>
          <div class="stock-list">
            <button
              v-for="stock in filteredStocks"
              :key="stock.sid"
              class="stock-row"
              @click="goDetail(stock)"
            >
              <div class="stock-avatar" :style="{ background: stock.color || '#7C5CFF' }">
                {{ stock.companyName.slice(0, 2) }}
              </div>
              <div class="stock-info">
                <div class="stock-name">{{ stock.companyName }}</div>
                <div class="stock-code">{{ stock.ticker }}</div>
              </div>
              <div class="stock-price-wrap">
                <div class="stock-price">{{ formatPrice(stock.currentPrice) }}</div>
                <div :class="['change-rate', stock.changeRate >= 0 ? 'gain' : 'loss']">
                  {{ formatRate(stock.changeRate) }}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStocksStore } from '@/stores/stocks'

const router = useRouter()
const marketStore = useStocksStore()

const query = ref('')
const filter = ref('all') // 'all' | 'watchlist'

// 검색 + 필터 적용
const filteredStocks = computed(() => {
  let list = filter.value === 'watchlist'
    ? marketStore.watchlistStocks
    : marketStore.stocks

  if (query.value.trim()) {
    const q = query.value.trim()
    list = list.filter(
      (s) => s.companyName.includes(q) || s.ticker.includes(q)
    )
  }
  return list
})

function onSearch() {
  // 검색 중엔 필터 초기화
  if (query.value) filter.value = 'all'
}

function goDetail(stock) {
  router.push({ name: 'stock-detail', params: { stockId: stock.sid } })
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
  marketStore.fetchList()
})
</script>

<style scoped>
.market-page {
  min-height: 100vh;
  background: #f7f6fb;
  padding-bottom: 100px;
}

/* 헤더 */
.market-header {
  background: white;
  padding: 60px 20px 16px;
  border-bottom: 1px solid #efedf4;
}
.page-title {
  font-size: 26px;
  font-weight: 800;
  color: #1E1A2E;
  letter-spacing: -0.025em;
}
.page-subtitle {
  font-size: 13px;
  color: #7A7388;
  margin-top: 4px;
}

/* 검색 */
.search-wrap {
  position: relative;
  margin-top: 16px;
}
.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #A8A2B5;
}
.search-input {
  width: 100%;
  height: 48px;
  background: #f7f6fb;
  border: 1.5px solid #efedf4;
  border-radius: 14px;
  padding: 0 40px 0 44px;
  font-size: 15px;
  color: #1E1A2E;
  outline: none;
}
.search-input:focus {
  border-color: #7C5CFF;
  background: white;
}
.search-clear {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #A8A2B5;
  font-size: 14px;
  background: none;
  border: none;
  cursor: pointer;
}

/* 필터 탭 */
.filter-tabs {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}
.filter-tab {
  height: 34px;
  padding: 0 16px;
  border-radius: 9999px;
  border: 1.5px solid #e4e2ed;
  background: white;
  font-size: 13px;
  font-weight: 600;
  color: #7A7388;
  cursor: pointer;
  transition: all 0.15s;
}
.filter-tab.active {
  background: #7C5CFF;
  border-color: #7C5CFF;
  color: white;
}

/* 섹션 */
.section {
  padding: 20px 20px 0;
}
.section-label {
  font-size: 12px;
  font-weight: 700;
  color: #7A7388;
  margin-bottom: 10px;
}

/* 급등 카드 */
.trending-list {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin: 0 -20px;
  padding-left: 20px;
  padding-right: 20px;
  scrollbar-width: none;
}
.trending-list::-webkit-scrollbar { display: none; }
.trending-card {
  min-width: 140px;
  background: white;
  border-radius: 18px;
  border: 1px solid #efedf4;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: rgba(20,14,60,0.03) 0 0 0 1px, rgba(20,14,60,0.05) 0 2px 8px;
  transition: transform 0.1s;
}
.trending-card:active { transform: scale(0.97); }
.trending-name {
  font-size: 14px;
  font-weight: 700;
  color: #1E1A2E;
  margin-top: 10px;
}
.trending-code {
  font-size: 11px;
  color: #A8A2B5;
  margin-top: 2px;
}

/* 종목 리스트 */
.stock-list {
  background: white;
  border-radius: 18px;
  border: 1px solid #efedf4;
  overflow: hidden;
  box-shadow: rgba(20,14,60,0.03) 0 0 0 1px, rgba(20,14,60,0.05) 0 2px 8px;
}
.stock-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid #efedf4;
  cursor: pointer;
  transition: background 0.1s;
}
.stock-row:last-child { border-bottom: none; }
.stock-row:active { background: #f7f6fb; }

/* 아바타 */
.stock-avatar {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  color: white;
}
.stock-info {
  flex: 1;
  min-width: 0;
}
.stock-name {
  font-size: 15px;
  font-weight: 700;
  color: #1E1A2E;
}
.stock-code {
  font-size: 12px;
  color: #A8A2B5;
  margin-top: 2px;
}
.stock-price-wrap {
  text-align: right;
}
.stock-price {
  font-size: 15px;
  font-weight: 700;
  color: #1E1A2E;
  font-variant-numeric: tabular-nums;
}

/* 등락률 */
.change-rate {
  font-size: 12px;
  font-weight: 700;
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
}
.gain { color: #E53935; }
.loss { color: #1E6EF4; }

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
