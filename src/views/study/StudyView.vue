<template>
  <div class="study-page">

    <div class="study-header">
      <h1 class="page-title">투자공부</h1>

      <!-- 검색바 -->
      <div class="search-wrap">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input v-model="query" class="search-input" placeholder="주식, 경제 단어를 검색해보세요" />
        <button v-if="query" class="search-clear" @click="query = ''">✕</button>
      </div>

      <!-- 카테고리 탭 -->
      <div class="category-tabs">
        <button
          :class="['cat-tab', { active: !showBookmarks && store.selectedCategory === '전체' }]"
          @click="onCategoryChange('전체')"
        >전체</button>
        <button
          :class="['cat-tab', { active: showBookmarks }]"
          @click="onShowBookmarks"
        >⭐ 저장</button>
        <button
          v-for="cat in CATEGORIES.slice(1)"
          :key="cat"
          :class="['cat-tab', { active: !showBookmarks && store.selectedCategory === cat }]"
          @click="onCategoryChange(cat)"
        >{{ cat }}</button>
      </div>
    </div>

    <!-- 로딩 -->
    <div v-if="store.isLoading" class="state-box">
      <div class="spinner" />
      <p>영상 불러오는 중...</p>
    </div>

    <!-- 에러 -->
    <div v-else-if="store.error" class="state-box">
      <p>⚠️ 영상을 불러오지 못했어요</p>
      <button class="retry-btn" @click="store.fetchList()">다시 시도</button>
    </div>

    <template v-else>
      <!-- 영상 없음 -->
      <div v-if="filtered.length === 0" class="state-box">
        <p>{{ showBookmarks ? '저장한 콘텐츠가 없어요' : query ? `'${query}' 검색 결과가 없어요` : '해당 카테고리에 영상이 없어요' }}</p>
      </div>

      <template v-else>
        <!-- 오늘의 추천 카드 (검색·관심 탭 아닐 때만) -->
        <div
          v-if="!query && !showBookmarks && featured"
          class="featured-card"
          :style="{ backgroundImage: `url(${featured.thumbnail})` }"
          @click="goDetail(featured)"
        >
          <span class="featured-tag">오늘의 추천</span>
          <h2 class="featured-title">{{ featured.title }}</h2>
          <span class="featured-meta">머니인사이드 · {{ featured.category }}</span>
        </div>

        <!-- 영상 리스트 -->
        <div class="video-list">
          <div
            v-for="video in listVideos"
            :key="video.isid"
            class="video-item"
            @click="goDetail(video)"
          >
            <img :src="video.thumbnail" :alt="video.title" class="item-thumb" />
            <div class="item-info">
              <p class="item-title">{{ video.title }}</p>
              <span class="item-meta">머니인사이드 · {{ video.category }}</span>
            </div>
            <button class="star-btn" @click.stop="store.toggleBookmark(video.isid)">
              <Star :size="18" :color="store.isBookmarked(video.isid) ? '#FFD700' : '#ccc'" :fill="store.isBookmarked(video.isid) ? '#FFD700' : 'none'" />
            </button>
          </div>
        </div>
      </template>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Star } from 'lucide-vue-next'
import { useStudyStore, CATEGORIES } from '@/stores/study'

const store = useStudyStore()
const router = useRouter()
const route = useRoute()
const query = ref('')
const showBookmarks = ref(false)

onMounted(async () => {
  store.fetchList()
  await store.fetchBookmarkIds()
  if (route.query.tab === 'bookmarks') {
    await onShowBookmarks()
  }
})

const featuredIndex = ref(0)

watch(() => store.videos, (videos) => {
  if (videos.length > 0) {
    featuredIndex.value = Math.floor(Math.random() * videos.length)
  }
})

const filtered = computed(() => {
  if (showBookmarks.value) {
    return store.bookmarks.filter((v) => store.isBookmarked(v.isid))
  }
  if (!query.value) return store.videos
  const q = query.value.toLowerCase()
  return store.videos.filter((v) => v.title.toLowerCase().includes(q))
})

const featured = computed(() => {
  if (showBookmarks.value || query.value) return null
  return store.videos[featuredIndex.value] ?? null
})

const listVideos = computed(() => {
  if (showBookmarks.value || query.value) return filtered.value
  const featuredIsid = featured.value?.isid
  return filtered.value.filter((v) => v.isid !== featuredIsid)
})

function onCategoryChange(cat) {
  query.value = ''
  showBookmarks.value = false
  store.fetchList(cat)
}

async function onShowBookmarks() {
  showBookmarks.value = true
  query.value = ''
  await store.fetchBookmarks()
}

function goDetail(video) {
  store.selectedVideo = video
  router.push({ name: 'study-detail', params: { id: video.isid } })
}
</script>

<style scoped>
.study-page {
  background: #f8f8f8;
  min-height: 100vh;
  padding-bottom: 24px;
}

/* ── 헤더 ── */
.study-header {
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

/* ── 검색바 ── */
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

/* ── 카테고리 탭 ── */
.category-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;

  scrollbar-width: thin;
  scrollbar-color: #ddd transparent;
}

.category-tabs::-webkit-scrollbar { height: 3px; }
.category-tabs::-webkit-scrollbar-button { display: none; }
.category-tabs::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
.category-tabs::-webkit-scrollbar-track { background: transparent; }

.cat-tab {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 9999px;
  border: 1.5px solid #ddd;
  background: #fff;
  color: #555;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.cat-tab.active {
  background: #111;
  border-color: #111;
  color: #fff;
  font-weight: 600;
}

/* ── 상태 박스 ── */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 16px;
  color: #888;
  font-size: 14px;
  gap: 12px;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #eee;
  border-top-color: #7C5CFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.retry-btn {
  padding: 8px 20px;
  border-radius: 8px;
  background: #7C5CFF;
  color: #fff;
  border: none;
  font-size: 14px;
  cursor: pointer;
}

/* ── 오늘의 추천 카드 ── */
.featured-card {
  margin: 16px;
  padding: 20px;
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.15s;
  position: relative;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  min-height: 140px;
}
.featured-card:active { transform: scale(0.98); }

.featured-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
}

.featured-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    189deg,
    rgba(255, 255, 255, 0.25) 0%,
    rgba(255, 255, 255, 0.25) 30%,
    transparent 55%
  );
}

.featured-tag,
.featured-title,
.featured-meta {
  position: relative;
  z-index: 1;
}

.featured-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: rgba(255, 255, 255, 0.25);
  padding: 3px 10px;
  border-radius: 20px;
  margin-bottom: 10px;
}
.featured-title {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  line-height: 1.45;
  margin: 0 0 10px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.featured-meta {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

/* ── 영상 리스트 ── */
.video-list {
  display: flex;
  flex-direction: column;
  padding: 0 16px;
  gap: 4px;
}

.video-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}
.video-item:last-child { border-bottom: none; }

.item-thumb {
  width: 120px;
  height: 68px;
  object-fit: cover;
  border-radius: 10px;
  flex-shrink: 0;
  background: #eee;
}

.item-info {
  flex: 1;
  min-width: 0;
}
.item-title {
  font-size: 14px;
  font-weight: 600;
  color: #111;
  line-height: 1.4;
  margin: 0 0 5px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.item-meta {
  font-size: 12px;
  color: #999;
}

.star-btn {
  border: none;
  background: transparent;
  padding: 4px;
  cursor: pointer;
  flex-shrink: 0;
}
</style>
