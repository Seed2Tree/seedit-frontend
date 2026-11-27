# Seedit 화면 설계

화면설계서(`Seedit_화면설계서`)의 화면 캡처입니다. 이미지는 [`screens/`](screens) 폴더에 있습니다.

[← README로 돌아가기](../README.md)

## 인증 플로우

**스플래시** · `SplashView.vue`  
브랜드를 노출하고 로그인 상태에 따라 다음 화면으로 자동 분기

<p><img src="screens/auth-01-splash.png" width="200" alt="스플래시"></p>

**온보딩** · `OnboardingView.vue`  
앱의 핵심 가치와 사용 흐름을 소개하는 스와이프형 인트로

<p><img src="screens/auth-02-onboarding-1.png" width="200" alt="온보딩"> <img src="screens/auth-02-onboarding-2.png" width="200" alt="온보딩"> <img src="screens/auth-02-onboarding-3.png" width="200" alt="온보딩"></p>

**로그인** · `LoginView.vue`  
이메일·비밀번호 로그인, 계정이 없으면 회원가입으로 이동

<p><img src="screens/auth-03-login.png" width="200" alt="로그인"></p>

**회원가입** · `SignupView.vue`  
이름·이메일·비밀번호 입력, 이메일 중복확인과 형식 검증

<p><img src="screens/auth-04-signup.png" width="200" alt="회원가입"></p>

**가입 완료** · `SignupCompleteView.vue`  
가입 축하와 시드머니 500만 원 지급 안내

<p><img src="screens/auth-05-signup-complete.png" width="200" alt="가입 완료"></p>

## 홈 탭

**홈** · `home/HomeView.vue`  
레벨, 모의자산, 오늘의 투자 운세, 오늘의 일지 대시보드

<p><img src="screens/home-01-home.png" width="200" alt="홈"></p>

**보유 종목** · `home/PortfolioView.vue`  
보유 종목 전체와 총 수익률 요약

<p><img src="screens/home-02-portfolio.png" width="200" alt="보유 종목"></p>

**보유 종목 상세** · `home/PortfolioDetailView.vue`  
종목별 평가·손익, 매수 가설/매도 복기, 추가 매수·매도

<p><img src="screens/home-03-portfolio-detail.png" width="200" alt="보유 종목 상세"></p>

**거래 내역** · `home/TradeHistoryView.vue`  
예수금과 기간별(1개월·3개월·전체) 거래 내역

<p><img src="screens/home-04-trade-history.png" width="200" alt="거래 내역"></p>

**거래 상세** · `home/TradeDetailView.vue`  
단일 거래의 체결 정보와 정산 상태

<p><img src="screens/home-05-trade-detail-1.png" width="200" alt="거래 상세"> <img src="screens/home-05-trade-detail-2.png" width="200" alt="거래 상세"></p>

## 투자종목 탭

**투자종목** · `market/MarketView.vue`  
종목 검색과 관심종목 필터

<p><img src="screens/market-01-market.png" width="200" alt="투자종목"></p>

**종목 상세** · `market/StockDetailView.vue`  
현재가·차트·기업 정보, 관심종목 토글, 매수·매도 진입

<p><img src="screens/market-02-stock-detail-1.png" width="200" alt="종목 상세"> <img src="screens/market-02-stock-detail-2.png" width="200" alt="종목 상세"></p>

**종목 상세 - 뉴스** · `market/StockDetailView.vue`  
RSS로 수집한 종목 관련 뉴스(매일경제·한국경제·서울경제)

<p><img src="screens/market-03-stock-news.png" width="200" alt="종목 상세 - 뉴스"></p>

**AI 종목 분석 리포트** · `study/DailyReportView.vue`  
분기 보고서 기반 AI 종목 분석 리포트

<p><img src="screens/market-04-ai-report-1.png" width="200" alt="AI 종목 분석 리포트"> <img src="screens/market-04-ai-report-2.png" width="200" alt="AI 종목 분석 리포트"></p>

**모의 매수** · `market/StockBuyView.vue`  
수량을 정해 모의 매수하고 투자 가설(매수 이유) 기록

<p><img src="screens/market-05-buy.png" width="200" alt="모의 매수"></p>

**모의 매도** · `market/StockSellView.vue`  
보유 수량 내 모의 매도하고 투자 복기(매도 이유) 기록

<p><img src="screens/market-06-sell-1.png" width="200" alt="모의 매도"> <img src="screens/market-06-sell-2.png" width="200" alt="모의 매도"></p>

## 투자일지 탭

**투자일지 (캘린더)** · `diary/DiaryView.vue`  
월간 캘린더에서 날짜별 거래·일지 기록을 도트로 확인

<p><img src="screens/diary-01-calendar.png" width="200" alt="투자일지 (캘린더)"></p>

**투자일지 상세** · `diary/DiaryDetailView.vue`  
날짜별 거래 내역과 일지 조회·작성·수정

<p><img src="screens/diary-02-detail.png" width="200" alt="투자일지 상세"></p>

**AI 피드백 생성** · `diary/DiaryDetailView.vue`  
거래·일지 기반 AI 피드백(점수·잘한 점·생각해볼 점·다음 액션)

<p><img src="screens/diary-03-ai-feedback-1.png" width="200" alt="AI 피드백 생성"> <img src="screens/diary-03-ai-feedback-2.png" width="200" alt="AI 피드백 생성"> <img src="screens/diary-03-ai-feedback-3.png" width="200" alt="AI 피드백 생성"></p>

## 투자공부 탭

**투자공부** · `study/StudyView.vue`  
금융 지식 영상 검색·카테고리 탐색, 오늘의 추천 영상

<p><img src="screens/study-01-study.png" width="200" alt="투자공부"></p>

**콘텐츠 상세** · `study/StudyDetailView.vue`  
영상 재생, 즐겨찾기, 댓글 작성·삭제

<p><img src="screens/study-02-detail-1.png" width="200" alt="콘텐츠 상세"> <img src="screens/study-02-detail-2.png" width="200" alt="콘텐츠 상세"></p>

## 마이페이지 탭

**마이페이지** · `profile/ProfileView.vue`  
프로필, 레벨, 잔고, 활동 통계, 저장한 영상

<p><img src="screens/mypage-01-profile.png" width="200" alt="마이페이지"></p>

**내 정보 수정** · `profile/ProfileSettingsView.vue`  
닉네임·생년월일 수정

<p><img src="screens/mypage-02-settings-1.png" width="200" alt="내 정보 수정"> <img src="screens/mypage-02-settings-2.png" width="200" alt="내 정보 수정"></p>

**비밀번호 변경** · `profile/ChangePassword.vue`  
현재 비밀번호 확인 후 새 비밀번호로 변경

<p><img src="screens/mypage-03-password-1.png" width="200" alt="비밀번호 변경"> <img src="screens/mypage-03-password-2.png" width="200" alt="비밀번호 변경"></p>

**계정 초기화** · `profile/ProfileView.vue`  
거래·일지·관심종목 기록 삭제 및 시드머니 초기화 확인

<p><img src="screens/mypage-04-reset.png" width="200" alt="계정 초기화"></p>

**계정 탈퇴** · `profile/ProfileView.vue`  
탈퇴 재확인 후 자동 로그아웃

<p><img src="screens/mypage-05-withdraw.png" width="200" alt="계정 탈퇴"></p>
