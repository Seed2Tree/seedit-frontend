<template>
  <div class="detail-page">

    <!-- 삭제 확인 모달 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal-card">
        <p class="modal-msg">댓글을 삭제할까요?</p>
        <div class="modal-actions">
          <button class="modal-cancel" @click="cancelDelete">취소</button>
          <button class="modal-confirm" @click="confirmDelete">삭제</button>
        </div>
      </div>
    </div>

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

      <!-- 댓글 섹션 -->
      <div class="comment-section">
        <h3 class="comment-title">댓글 <span class="comment-count">{{ comments.length }}</span></h3>

        <!-- 댓글 입력 -->
        <div class="comment-input-wrap">
          <div class="comment-avatar"><Sprout :size="16" color="white" /></div>
          <input
            v-model="commentText"
            class="comment-input"
            placeholder="댓글을 입력하세요"
            @keydown.enter.prevent="submitComment"
          />
          <button class="comment-submit" :disabled="!commentText.trim()" @click="submitComment">등록</button>
        </div>

        <!-- 댓글 목록 -->
        <div v-if="comments.length === 0" class="comment-empty">첫 번째 댓글을 남겨보세요</div>

        <div v-for="c in comments" :key="c.scid" class="comment-item">
          <div class="comment-avatar"><Sprout :size="16" color="white" /></div>
          <div class="comment-body">
            <div class="comment-meta">
              <span class="comment-author">{{ c.username }}</span>
              <span class="comment-date">{{ formatDate(c.createdAt) }}</span>
              <span v-if="c.updatedAt !== c.createdAt" class="comment-edited">(수정됨)</span>
            </div>

            <!-- 일반 표시 -->
            <p v-if="editingScid !== c.scid" class="comment-content">{{ c.content }}</p>

            <!-- 인라인 수정 -->
            <div v-else class="comment-edit-wrap">
              <input v-model="editText" class="comment-edit-input" @keydown.enter.prevent="saveEdit(c.scid)" />
              <div class="comment-edit-actions">
                <button class="edit-save" @click="saveEdit(c.scid)">저장</button>
                <button class="edit-cancel" @click="cancelEdit">취소</button>
              </div>
            </div>

            <!-- 수정/삭제 버튼 (본인 댓글만) -->
            <div v-if="c.isMine && editingScid !== c.scid" class="comment-actions">
              <button class="action-btn" @click="startEdit(c)">수정</button>
              <button class="action-btn delete" @click="removeComment(c.scid)">삭제</button>
            </div>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Sprout } from 'lucide-vue-next'
import { useStudyStore } from '@/stores/study'
import { useHeaderStore } from '@/stores/header'
import { studyApi } from '@/api/study'

const route = useRoute()
const router = useRouter()
const store = useStudyStore()
const headerStore = useHeaderStore()

const video = computed(() => store.selectedVideo)
const videoId = computed(() => store.videoIdFrom(video.value?.youtubeUrl))

// 댓글
const comments = ref([])
const commentText = ref('')
const editingScid = ref(null)
const editText = ref('')
const showDeleteModal = ref(false)
const deleteTargetScid = ref(null)

async function fetchComments() {
  try {
    const res = await studyApi.getComments(video.value.isid)
    comments.value = res.data
  } catch {
    comments.value = []
  }
}

async function submitComment() {
  if (!commentText.value.trim()) return
  await studyApi.addComment(video.value.isid, commentText.value.trim())
  commentText.value = ''
  await fetchComments()
}

function startEdit(comment) {
  editingScid.value = comment.scid
  editText.value = comment.content
}

function cancelEdit() {
  editingScid.value = null
  editText.value = ''
}

async function saveEdit(scid) {
  if (!editText.value.trim()) return
  await studyApi.updateComment(video.value.isid, scid, editText.value.trim())
  cancelEdit()
  await fetchComments()
}

function removeComment(scid) {
  deleteTargetScid.value = scid
  showDeleteModal.value = true
}

async function confirmDelete() {
  await studyApi.deleteComment(video.value.isid, deleteTargetScid.value)
  showDeleteModal.value = false
  deleteTargetScid.value = null
  await fetchComments()
}

function cancelDelete() {
  showDeleteModal.value = false
  deleteTargetScid.value = null
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 북마크
async function toggleBookmark() {
  if (!video.value) return
  await store.toggleBookmark(video.value.isid)
  headerStore.set({ isStarred: store.isBookmarked(video.value.isid) })
}

onMounted(async () => {
  if (!store.selectedVideo || String(store.selectedVideo.isid) !== String(route.params.id)) {
    await store.fetchDetail(Number(route.params.id))
  }
  await store.fetchBookmarkIds()
  headerStore.set({ isStarred: store.isBookmarked(video.value?.isid), onStarClick: toggleBookmark })
  await fetchComments()
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
.yt-icon { font-size: 13px; }

/* ── 댓글 섹션 ── */
.comment-section {
  background: #fff;
  margin-top: 8px;
  padding: 16px;
}

.comment-title {
  font-size: 15px;
  font-weight: 700;
  color: #111;
  margin: 0 0 14px;
}
.comment-count {
  color: #7C5CFF;
  font-size: 14px;
}

/* 입력창 */
.comment-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.comment-input {
  flex: 1;
  border: 1.5px solid #e8e8e8;
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 13px;
  color: #333;
  outline: none;
  background: #fafafa;
}
.comment-input:focus { border-color: #7C5CFF; background: #fff; }
.comment-submit {
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: 20px;
  background: #7C5CFF;
  color: #fff;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.comment-submit:disabled { background: #ddd; cursor: default; }

/* 빈 상태 */
.comment-empty {
  text-align: center;
  color: #bbb;
  font-size: 13px;
  padding: 24px 0;
}

/* 댓글 아이템 */
.comment-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid #f5f5f5;
}
.comment-body { flex: 1; min-width: 0; }

.comment-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.comment-author {
  font-size: 13px;
  font-weight: 600;
  color: #111;
}
.comment-date {
  font-size: 11px;
  color: #bbb;
}
.comment-edited {
  font-size: 11px;
  color: #bbb;
}
.comment-content {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  margin: 0;
  word-break: break-word;
}

/* 인라인 수정 */
.comment-edit-wrap { margin-top: 4px; }
.comment-edit-input {
  width: 100%;
  border: 1.5px solid #7C5CFF;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  color: #333;
  outline: none;
  box-sizing: border-box;
}
.comment-edit-actions {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.edit-save, .edit-cancel {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}
.edit-save { background: #7C5CFF; color: #fff; }
.edit-cancel { background: #f0f0f0; color: #555; }

/* 수정/삭제 버튼 */
.comment-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
.action-btn {
  font-size: 11px;
  color: #aaa;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.action-btn:hover { color: #555; }
.action-btn.delete:hover { color: #e53935; }

/* 삭제 확인 모달 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.modal-card {
  background: #fff;
  border-radius: 16px;
  padding: 28px 24px 20px;
  width: 272px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
}
.modal-msg {
  font-size: 15px;
  font-weight: 600;
  color: #111;
  margin: 0 0 22px;
}
.modal-actions {
  display: flex;
  gap: 8px;
}
.modal-cancel {
  flex: 1;
  padding: 11px;
  border-radius: 10px;
  border: none;
  background: #f0f0f0;
  color: #555;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.modal-confirm {
  flex: 1;
  padding: 11px;
  border-radius: 10px;
  border: none;
  background: #e53935;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>
