<template>
  <div class="market-page">
    <!-- 헤더 -->
    <div class="market-header">
      <h1 class="page-title">투자종목</h1>

      <!-- 검색창 -->
      <div class="search-wrap">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
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
        <button :class="['filter-tab', { active: filter === 'all' }]" @click="filter = 'all'">
          전체
        </button>
        <button
          :class="['filter-tab', { active: filter === 'watchlist' }]"
          @click="filter = 'watchlist'"
        >
          ⭐ 관심종목
        </button>
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
        <div v-if="!query && filter === 'all' && marketStore.trendingStocks.length > 0" class="trending-section">
          <p class="section-label">🔥 오늘 가장 많이 오른 종목</p>

          <!-- TOP 1 featured 카드 -->
          <button class="trending-featured" @click="goDetail(marketStore.trendingStocks[0])">
            <div class="featured-rank">1위</div>
            <div class="featured-body">
              <img
            :src="logoUrl(marketStore.trendingStocks[0].ticker)"
            class="featured-avatar"
            :alt="marketStore.trendingStocks[0].companyName.slice(0, 2)"
            @error="(e) => onLogoError(e, marketStore.trendingStocks[0].companyName)"
          />
              <div class="featured-info">
                <span class="featured-name">{{ marketStore.trendingStocks[0].companyName }}</span>
                <span class="featured-ticker">{{ marketStore.trendingStocks[0].ticker }}</span>
              </div>
            </div>
            <div class="featured-rate">{{ formatRate(marketStore.trendingStocks[0].changeRate) }}</div>
          </button>

          <!-- TOP 2~3 compact 카드 -->
          <div class="trending-row">
            <button
              v-for="(stock, i) in marketStore.trendingStocks.slice(1, 3)"
              :key="stock.sid"
              class="trending-mini"
              @click="goDetail(stock)"
            >
              <span class="mini-rank">{{ i + 2 }}위</span>
              <img
                :src="logoUrl(stock.ticker)"
                class="mini-avatar"
                :alt="stock.companyName.slice(0, 2)"
                @error="(e) => onLogoError(e, stock.companyName)"
              />
              <div class="mini-info">
                <span class="mini-name">{{ stock.companyName }}</span>
                <span class="mini-rate gain">{{ formatRate(stock.changeRate) }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- 종목 리스트 -->
        <div class="list-section">
          <p class="section-label">
            {{ query ? `'${query}' 검색 결과` : filter === 'watchlist' ? '관심종목' : '전체 종목' }}
          </p>
          <div class="stock-list">
            <button
              v-for="stock in filteredStocks"
              :key="stock.sid"
              class="stock-row"
              @click="goDetail(stock)"
            >
              <img
                :src="logoUrl(stock.ticker)"
                class="stock-avatar"
                :alt="stock.companyName.slice(0, 2)"
                @error="(e) => onLogoError(e, stock.companyName)"
              />
              <div class="stock-info">
                <span class="stock-name">{{ stock.companyName }}</span>
                <span class="stock-code">{{ stock.ticker }}</span>
              </div>
              <div class="stock-price-wrap">
                <span class="stock-price">{{ formatPrice(stock.currentPrice) }}</span>
                <span :class="['change-rate', stock.changeRate >= 0 ? 'gain' : 'loss']">
                  {{ formatRate(stock.changeRate) }}
                </span>
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
const filter = ref('all')

const filteredStocks = computed(() => {
  let list = filter.value === 'watchlist' ? marketStore.watchlistStocks : marketStore.stocks
  if (query.value.trim()) {
    const q = query.value.trim().toLowerCase()
    list = list.filter((s) => s.companyName.toLowerCase().includes(q) || s.ticker.toLowerCase().includes(q) || s.searchKeywords?.toLowerCase().includes(q))
  }
  return list
})

function onSearch() {
  if (query.value) filter.value = 'all'
}

function goDetail(stock) {
  router.push({ name: 'stock-detail', params: { ticker: stock.ticker } })
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

function logoUrl(ticker) {
  return `https://file.alphasquare.co.kr/media/images/stock_logo/kr/${ticker}.png`
}

function onLogoError(e, companyName) {
  const initials = companyName.slice(0, 2)
  e.target.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' rx='12' fill='%23ede9ff'/><text x='50%25' y='50%25' font-family='sans-serif' font-size='13' font-weight='800' fill='%237c5cff' text-anchor='middle' dominant-baseline='central'>${initials}</text></svg>`
  e.target.onerror = null
}

onMounted(() => {
  marketStore.fetchList()
})
</script>

<style scoped>
.market-page {
  min-height: 100vh;
  background: #f8f8f8;
  padding-bottom: 100px;
}

/* ── 헤더 ── */
.market-header {
  background: #fff;
  padding: 20px 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #111;
  margin: 0 0 14px;
}

/* ── 검색 ── */
.search-wrap {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 0 12px;
  margin-bottom: 14px;
}
.search-icon { color: #aaa; flex-shrink: 0; }
.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 10px 8px;
  font-size: 14px;
  color: #333;
  outline: none;
}
.search-input::placeholder { color: #bbb; }
.search-clear {
  border: none;
  background: transparent;
  color: #aaa;
  font-size: 13px;
  cursor: pointer;
  padding: 4px;
}

/* ── 필터 탭 ── */
.filter-tabs {
  display: flex;
  gap: 8px;
  padding-bottom: 12px;
}
.filter-tab {
  height: 32px;
  padding: 0 14px;
  border-radius: 9999px;
  border: 1.5px solid #ddd;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  cursor: pointer;
  transition: all 0.15s;
}
.filter-tab.active {
  background: #7c5cff;
  border-color: #7c5cff;
  color: #fff;
  font-weight: 600;
}

/* ── 섹션 공통 ── */
.section-label {
  font-size: 13px;
  font-weight: 700;
  color: #555;
  margin: 0 0 10px;
}

/* ── 급등 섹션 ── */
.trending-section {
  padding: 20px 16px 0;
}

/* TOP 1 featured */
.trending-featured {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #7c5cff, #a07bff);
  border: none;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 10px;
  cursor: pointer;
  text-align: left;
  transition: transform 0.1s;
}
.trending-featured:active { transform: scale(0.98); }

.featured-rank {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,255,255,0.75);
  background: rgba(255,255,255,0.2);
  padding: 3px 8px;
  border-radius: 20px;
  flex-shrink: 0;
}
.featured-body {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.featured-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(255,255,255,0.25);
  object-fit: contain;
  flex-shrink: 0;
}
.featured-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.featured-name {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.featured-ticker {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  margin-top: 2px;
}
.featured-rate {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  flex-shrink: 0;
}

/* TOP 2~3 */
.trending-row {
  display: flex;
  gap: 10px;
  margin-bottom: 4px;
}
.trending-mini {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  padding: 12px;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}
.trending-mini:active { background: #f8f8f8; }

.mini-rank {
  font-size: 11px;
  font-weight: 700;
  color: #aaa;
  flex-shrink: 0;
}
.mini-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #ede9ff;
  object-fit: contain;
  flex-shrink: 0;
}
.mini-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.mini-name {
  font-size: 13px;
  font-weight: 600;
  color: #111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mini-rate {
  font-size: 12px;
  font-weight: 700;
  margin-top: 2px;
}

/* ── 종목 리스트 ── */
.list-section {
  padding: 20px 16px 0;
}
.stock-list {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
}
.stock-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: none;
  border: none;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}
.stock-row:last-child { border-bottom: none; }
.stock-row:active { background: #f8f8f8; }

.stock-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #ede9ff;
  object-fit: contain;
  flex-shrink: 0;
}
.stock-info { flex: 1; min-width: 0; }
.stock-name {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #111;
}
.stock-code {
  display: block;
  font-size: 12px;
  color: #aaa;
  margin-top: 2px;
}
.stock-price-wrap { text-align: right; flex-shrink: 0; }
.stock-price {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #111;
  font-variant-numeric: tabular-nums;
}

/* ── 등락률 ── */
.change-rate {
  display: block;
  font-size: 12px;
  font-weight: 700;
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
}
.gain { color: #e53935; }
.loss { color: #1e6ef4; }

/* ── 상태 ── */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 20px;
  color: #888;
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
@keyframes spin { to { transform: rotate(360deg); } }
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
