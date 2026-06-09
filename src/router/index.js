import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ── 인증 플로우 (탭바 없음) ──────────────────────────────
    {
      path: '/',
      component: () => import('@/layouts/AuthLayout.vue'),
      children: [
        { path: '', redirect: '/splash' },
        {
          path: 'splash',
          name: 'splash',
          component: () => import('@/views/SplashView.vue'),
        },
        {
          path: 'onboarding',
          name: 'onboarding',
          component: () => import('@/views/OnboardingView.vue'),
        },
        {
          path: 'login',
          name: 'login',
          component: () => import('@/views/LoginView.vue'),
        },
        {
          path: 'signup',
          name: 'signup',
          component: () => import('@/views/SignupView.vue'),
        },
        {
          path: 'signup/complete',
          name: 'signup-complete',
          component: () => import('@/views/SignupCompleteView.vue'),
        },
      ],
    },

    // ── 메인 플로우 (탭바 있음, 로그인 필요) ─────────────────
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [

        // ── 홈 탭 ─────────────────────────────────────────
        {
          path: 'home',
          name: 'home',
          component: () => import('@/views/home/HomeView.vue'),
        },
        {
          // F06: 보유 종목 전체 목록 + 총 수익률
          path: 'home/portfolio',
          name: 'portfolio',
          component: () => import('@/views/home/PortfolioView.vue'),
        },
        {
          // F06: 보유 종목 개별 상세 (StockDetailView 재사용)
          path: 'home/portfolio/:ticker',
          name: 'portfolio-detail',
          component: () => import('@/views/market/StockDetailView.vue'),
        },
        {
          // F24: 레벨/포인트/미션 (홈에서 진입)
          path: 'home/garden',
          name: 'garden',
          component: () => import('@/views/GardenView.vue'),
        },
        {
          // F41: 단타 경고 알림
          path: 'home/alerts',
          name: 'alerts',
          component: () => import('@/views/home/AlertsView.vue'),
        },
        {
          // F42: AI 포트폴리오 리포트
          path: 'home/report/portfolio',
          name: 'report-portfolio',
          component: () => import('@/views/home/PortfolioReportView.vue'),
        },

        // ── 투자종목 탭 ───────────────────────────────────
        {
          // F01: 종목 목록 + 검색 + 관심종목 필터
          path: 'market',
          name: 'market',
          component: () => import('@/views/market/MarketView.vue'),
        },
        {
          // F01: 종목 상세 (차트, 현재가, 관심종목 토글 F07)
          path: 'market/:ticker',
          name: 'stock-detail',
          component: () => import('@/views/market/StockDetailView.vue'),
        },
        {
          // F02 + F03: 모의 매수 + 투자 가설 작성
          path: 'market/:ticker/buy',
          name: 'stock-buy',
          component: () => import('@/views/market/StockBuyView.vue'),
        },
        {
          // F04 + F05: 모의 매도 + 투자 복기
          path: 'market/:ticker/sell',
          name: 'stock-sell',
          component: () => import('@/views/market/StockSellView.vue'),
        },

        // ── 투자일지 탭 ───────────────────────────────────
        {
          // F12: 일기 목록 (캘린더 + 날짜별 조회)
          path: 'diary',
          name: 'diary',
          component: () => import('@/views/diary/DiaryView.vue'),
        },
        {
          // F11 + F12 + F13: 일기 상세 조회 + 내용 수정 + AI 피드백
          // (매수/매도 시 자동 생성, 별도 작성 화면 없음)
          path: 'diary/:id',
          name: 'diary-detail',
          component: () => import('@/views/diary/DiaryDetailView.vue'),
        },

        // ── 투자공부 탭 ───────────────────────────────────
        {
          // F31: 금융 지식 콘텐츠 목록 + F43 데일리 리포트 진입
          path: 'study',
          name: 'study',
          component: () => import('@/views/study/StudyView.vue'),
        },
        {
          // F43: AI 데일리 경제 리포트 (뉴스)
          path: 'study/daily',
          name: 'study-daily',
          component: () => import('@/views/study/DailyReportView.vue'),
        },
        {
          // F31 + F32: 콘텐츠 상세 + 즐겨찾기
          path: 'study/:id',
          name: 'study-detail',
          component: () => import('@/views/study/StudyDetailView.vue'),
        },

        // ── 마이페이지 탭 ─────────────────────────────────
        {
          // F23: 사용자 프로필 + 활동 내역
          path: 'mypage',
          name: 'mypage',
          component: () => import('@/views/profile/ProfileView.vue'),
        },
        {
          path: 'mypage/settings',
          name: 'mypage-settings',
          component: () => import('@/views/profile/ProfileSettingsView.vue'),
        },
      ],
    },

    { path: '/:pathMatch(.*)*', redirect: '/splash' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login' }
  }
})

export default router
