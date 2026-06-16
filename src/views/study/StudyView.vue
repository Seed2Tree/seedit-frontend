<template>
  <div class="study-page">

    <div class="study-header">
      <div class="page-title">투자공부</div>
      <div class="page-subtitle">선별된 금융 교육 영상을 만나보세요</div>

      <!-- 카테고리 탭 -->
      <div class="category-tabs">
        <button
          v-for="cat in CATEGORIES"
          :key="cat"
          :class="['cat-tab', { active: store.selectedCategory === cat }]"
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

    <!-- 영상 없음 -->
    <div v-else-if="store.videos.length === 0" class="state-box">
      <p>해당 카테고리에 영상이 없어요</p>
    </div>

    <!-- 영상 그리드 -->
    <div v-else class="video-grid">
      <div
        v-for="video in store.videos"
        :key="video.isid"
        class="video-card"
        @click="goDetail(video)"
      >
        <div class="thumbnail-wrap">
          <img :src="video.thumbnail" :alt="video.title" class="thumbnail" />
          <div class="play-icon">▶</div>
        </div>
        <div class="video-info">
          <span class="video-category">{{ video.category }}</span>
          <p class="video-title">{{ video.title }}</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStudyStore, CATEGORIES } from '@/stores/study'

const store = useStudyStore()
const router = useRouter()

onMounted(() => {
  store.fetchList()
})

function onCategoryChange(cat) {
  store.fetchList(cat)
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
}

.study-header {
  background: #fff;
  padding: 20px 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #111;
}

.page-subtitle {
  font-size: 13px;
  color: #888;
  margin-top: 4px;
  margin-bottom: 16px;
}

.category-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 12px;
  scrollbar-width: none;
}
.category-tabs::-webkit-scrollbar { display: none; }

.cat-tab {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 20px;
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
  background: #7C5CFF;
  border-color: #7C5CFF;
  color: #fff;
  font-weight: 600;
}

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

.video-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 16px;
}

.video-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  transition: transform 0.15s;
}
.video-card:active { transform: scale(0.97); }

.thumbnail-wrap {
  position: relative;
}
.thumbnail {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  display: block;
}
.play-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.15);
  color: #fff;
  font-size: 22px;
  opacity: 0;
  transition: opacity 0.15s;
}
.video-card:hover .play-icon { opacity: 1; }

.video-info {
  padding: 8px 10px 10px;
}
.video-category {
  font-size: 11px;
  color: #7C5CFF;
  font-weight: 600;
  background: #f0ecff;
  padding: 2px 7px;
  border-radius: 10px;
}
.video-title {
  margin: 6px 0 0;
  font-size: 12px;
  font-weight: 500;
  color: #222;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
