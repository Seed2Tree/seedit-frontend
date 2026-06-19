<template>
  <div class="detail-page">

    <!-- 로딩 -->
    <div v-if="store.isLoading" class="state-box">
      <div class="spinner" />
      <p>영상 불러오는 중...</p>
    </div>

    <!-- 에러 / 못 찾음 -->
    <div v-else-if="store.error || !video" class="state-box">
      <p>⚠️ 영상을 찾을 수 없어요</p>
      <button class="back-btn" @click="router.back()">돌아가기</button>
    </div>

    <template v-else>
      <!-- 영상 플레이어 -->
      <div class="player-wrap">
        <iframe
          :src="`https://www.youtube.com/embed/${videoId}`"
          class="player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          frameborder="0"
        />
      </div>

      <!-- 영상 정보 -->
      <div class="video-info">
        <span class="category-badge">{{ video.category }}</span>
        <h2 class="video-title">{{ video.title }}</h2>
        <p v-if="video.description" class="video-desc">{{ video.description }}</p>
      </div>

      <!-- 유튜브 원본 링크 -->
      <div class="link-wrap">
        <a :href="video.youtubeUrl" target="_blank" rel="noopener" class="youtube-link">
          <span class="yt-icon">▶</span> 유튜브에서 보기
        </a>
      </div>

    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudyStore } from '@/stores/study'
import { useHeaderStore } from '@/stores/header'

const route = useRoute()
const router = useRouter()
const store = useStudyStore()
const headerStore = useHeaderStore()

const video = computed(() => store.selectedVideo)
const videoId = computed(() => store.videoIdFrom(video.value?.youtubeUrl))

const isBookmarked = ref(false)
function toggleBookmark() {
  isBookmarked.value = !isBookmarked.value
  headerStore.set({ isStarred: isBookmarked.value })
  // TODO: API 연결 시 store.addBookmark(video.value.isid) / store.removeBookmark(video.value.isid)
}

onMounted(async () => {
  if (!store.selectedVideo || String(store.selectedVideo.isid) !== String(route.params.id)) {
    await store.fetchDetail(Number(route.params.id))
  }
  // 헤더 별 버튼에 즐겨찾기 핸들러 등록
  headerStore.set({ isStarred: isBookmarked.value, onStarClick: toggleBookmark })
})
</script>

<style scoped>
.detail-page {
  background: #f8f8f8;
  min-height: 100vh;
  padding-bottom: 32px;
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 16px;
  gap: 16px;
  color: #888;
  font-size: 14px;
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

.back-btn {
  padding: 8px 20px;
  border-radius: 8px;
  background: #7C5CFF;
  color: #fff;
  border: none;
  cursor: pointer;
}

.player-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: #000;
}
.player {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.video-info {
  background: #fff;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.category-badge {
  font-size: 11px;
  color: #7C5CFF;
  font-weight: 600;
  background: #f0ecff;
  padding: 3px 8px;
  border-radius: 10px;
}

.video-title {
  font-size: 16px;
  font-weight: 700;
  color: #111;
  margin: 10px 0 0;
  line-height: 1.45;
}

.video-desc {
  font-size: 13px;
  color: #666;
  margin-top: 8px;
  line-height: 1.6;
}

.link-wrap {
  padding: 12px 16px;
}
.youtube-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #E53935;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}
.youtube-link:hover { opacity: 0.75; }
.yt-icon {
  font-size: 13px;
}
</style>
