<template>
  <div class="profile">
    <h2 class="page-title">마이페이지</h2>
    <p v-if="error" class="error">{{ error }}</p>

    <!-- 프로필 대시보드 -->
    <section class="dashboard">
      <div class="profile-row">
        <div class="avatar"><Sprout :size="28" color="white" /></div>
        <div class="profile-meta">
          <span class="badge-day">{{ user.day }}일차 {{ level.levelName }}</span>
          <strong class="name">{{ user.name }} 님</strong>
        </div>
        <button class="edit-btn" aria-label="프로필 수정" @click="onEdit">
          <Pencil :size="18" />
        </button>
      </div>

      <!-- 레벨 진행 -->
      <div class="level">
        <div class="level-head">
          <span class="level-text">Lv.{{ level.level }} · {{ level.levelName }}</span>
          <span class="level-days">{{ level.point }} / {{ nextLevelPoint }} P</span>
        </div>
        <div class="progress">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <!-- 보유 잔고 -->
      <div class="balance-row">
        <span class="balance-label">보유 잔고</span>
        <span class="balance-value">{{ won(user.balance) }}원</span>
      </div>

      <!-- 통계 -->
      <div class="statistics">
        <div class="stat">
          <span class="stat-label">총 일지</span>
          <strong class="stat-value">{{ stats.diaryCount }}편</strong>
        </div>
        <div class="stat">
          <span class="stat-label">누적 거래</span>
          <strong class="stat-value">{{ stats.transactionCount }}회</strong>
        </div>
        <div class="stat">
          <span class="stat-label">관심 종목</span>
          <strong class="stat-value">{{ stats.watchlistCount }}개</strong>
        </div>
      </div>
    </section>

    <!-- 내가 저장한 글 -->
    <section class="saved">
      <div class="section-head">
        <h3 class="section-title">내가 저장한 글</h3>
        <button class="view-all" @click="onViewAll">전체보기</button>
      </div>
      <div class="saved-scroll">
        <article
          v-for="post in savedPosts"
          :key="post.id"
          class="saved-card"
          @click="onOpenPost(post)"
        >
          <div class="saved-thumb" :style="{ background: post.bg }"></div>
          <p class="saved-title">{{ post.title }}</p>
        </article>
      </div>
    </section>

    <!-- 비밀번호 변경 -->
    <button class="menu-item" @click="onChangePassword">
      <Lock :size="18" class="menu-icon" />
      <span class="menu-label">비밀번호 변경</span>
      <ChevronRight :size="20" class="menu-chevron" />
    </button>

    <!-- 푸터 액션 -->
    <div class="footer-actions">
      <div class="footer-left">
        <button class="text-link" @click="onLogout">로그아웃</button>
        <button class="text-link" @click="onResetAccount">계정 초기화</button>
      </div>
      <button class="text-link" @click="onWithdraw">회원탈퇴</button>
    </div>

    <p class="version">Seedit v{{ appVersion }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Sprout, Pencil, Lock, ChevronRight } from 'lucide-vue-next'
import { authApi } from '@/api/auth'
import { userApi } from '@/api/user'

const router = useRouter()
const appVersion = '1.0.0'
const error = ref('')

// 기본값으로 초기화 → 데이터 로드 전에도 템플릿이 안 깨짐
const user = ref({ name: '', day: 0, balance: 0, totalInvested: 0 })
const level = ref({ level: 1, levelName: '', point: 0 })
const stats = ref({ diaryCount: 0, transactionCount: 0, watchlistCount: 0, studyBookmarkCount: 0 })

const nextLevelPoint = 100 // TODO: 다음 레벨 기준 포인트를 API에서 받으면 교체
const progressPercent = computed(() =>
  Math.min(100, Math.round((level.value.point / nextLevelPoint) * 100)),
)

function won(n) {
  return Number(n ?? 0).toLocaleString('ko-KR')
}

const savedPosts = ref([
  {
    id: 1,
    title: '학생 투자자가 자주 하는 실수 5가지',
    bg: 'linear-gradient(135deg,#a78bfa,#c7b6fd)',
  },
  { id: 2, title: '코스피 2,700 회복 외국인 매수', bg: 'linear-gradient(135deg,#fbb36b,#fcd6ad)' },
  { id: 3, title: 'AI 반도체 다음 사이클은 언제?', bg: 'linear-gradient(135deg,#7ee0a0,#bff3cf)' },
])

function onEdit() {
  router.push('/mypage/settings')
}
function onViewAll() {
  router.push({ name: 'saved-posts' })
}
function onOpenPost(post) {
  router.push({ name: 'post', params: { id: post.id } })
}
function onChangePassword() {
  router.push('/mypage/password')
}
async function onLogout() {
  try {
    await authApi.logout()
  } catch (e) {
    // 서버 호출 실패해도 클라이언트 토큰은 정리
  } finally {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    router.push({ name: 'login' })
  }
}
function onResetAccount() {
  if (!confirm('정말 계정을 초기화할까요? 거래/일지 기록이 모두 사라져요.')) return
  // TODO: 계정 초기화 API 호출
}
async function onWithdraw() {
  if (!confirm('정말 탈퇴하시겠어요? 되돌릴 수 없어요.')) return
  try {
    await userApi.deleteprofile()
  } catch (e) {
    // 무시하고 로그아웃 처리
  } finally {
    onLogout()
  }
}

onMounted(async () => {
  try {
    const res = await userApi.getMe()
    const u = res.data

    // 가입일로부터 며칠째인지 (가입 당일 = 1일차)
    const created = new Date(u.createdAt)
    const dayCount = Math.floor((Date.now() - created.getTime()) / 86400000) + 1

    user.value = {
      name: u.username, // 화면에 보이는 닉네임
      balance: u.balance,
      totalInvested: u.totalInvested,
      day: dayCount,
    }
    level.value = { level: u.level.level, levelName: u.level.levelName, point: u.level.point }
    stats.value = { ...u.activity }
  } catch (e) {
    error.value = '프로필을 불러오지 못했어요.'
  }
})
</script>

<style scoped>
.profile {
  padding: 8px 20px 32px;
  color: #1e1a2e;
  font-family: Pretendard;
}

.page-title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 8px 0 16px;
}

/* 대시보드 카드 */
.dashboard {
  background: #fff;
  border: 1px solid #f0edf7;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 6px 20px rgba(124, 92, 255, 0.06);
}

.profile-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.profile-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.badge-day {
  font-size: 12px;
  font-weight: 700;
  color: #7c5cff;
}
.name {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.edit-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #efedf5;
  background: #fff;
  color: #7a7388;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

/* 레벨 진행 */
.level {
  margin-top: 18px;
}
.level-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.level-text {
  font-size: 12px;
  font-weight: 600;
  color: #7a7388;
}
.level-days {
  font-size: 12px;
  font-weight: 700;
  color: #7c5cff;
}
.progress {
  height: 8px;
  border-radius: 99px;
  background: #ece8fb;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #7c5cff, #a78bfa);
  transition: width 0.3s ease;
}

/* 통계 */
.statistics {
  display: flex;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #f3f1f8;
}
.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.stat-label {
  font-size: 12px;
  color: #7a7388;
  font-weight: 500;
}
.stat-value {
  font-size: 17px;
  font-weight: 800;
}
.stat-value.is-up {
  color: #f04452;
}
.stat-value.is-down {
  color: #3b82f6;
}

/* 내가 저장한 글 */
.saved {
  margin-top: 28px;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-title {
  font-size: 16px;
  font-weight: 800;
}
.view-all {
  background: none;
  border: none;
  font-size: 12px;
  color: #9a97ae;
  cursor: pointer;
  font-size: var(--item-spacing-12, 12px);
  text-decoration-line: underline;
}
.saved-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  margin: 0 -20px;
  padding: 0 20px 4px;
  scrollbar-width: none;
}
.saved-scroll::-webkit-scrollbar {
  display: none;
}
.saved-card {
  flex: 0 0 160px;
  cursor: pointer;
  display: flex;
  width: 160px;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--item-spacing-7_27, 7.275px);
}
.saved-thumb {
  display: flex;
  height: 100px;
  justify-content: center;
  align-items: center;
  align-self: stretch;
  border-radius: 14px;
}
.saved-title {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.35;
}

/* 메뉴 항목 */
.menu-item {
  width: 100%;
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #f0edf7;
  background: #fff;
  cursor: pointer;
}
.menu-icon {
  color: #7a7388;
}
.menu-label {
  flex: 1;
  text-align: left;
  font-size: 15px;
  font-weight: 600;
}
.menu-chevron {
  color: #c0bbc9;
}

/* 푸터 */
.footer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 28px;
  padding-top: 18px;
  border-top: 1px solid #f3f1f8;
}
.footer-left {
  display: flex;
  gap: 18px;
}
.text-link {
  background: none;
  border: none;
  color: #9a97ae;
  cursor: pointer;
  padding: 0;
  font-size: var(--item-spacing-12, 12px);
  text-decoration-line: underline;
}
.version {
  margin-top: 18px;
  text-align: center;
  font-size: 12px;
  color: #c0bbc9;
}

.balance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #f3f1f8;
}
.balance-label {
  font-size: 13px;
  color: #7a7388;
}
.balance-value {
  font-size: 16px;
  font-weight: 800;
  color: #1e1a2e;
}
.error {
  font-size: 13px;
  color: #e53935;
  margin: 0 0 12px;
}
</style>
