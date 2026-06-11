<template>
  <nav class="tab-bar">
    <RouterLink to="/diary" class="tab-item">
      <div class="tab-icon">
        <FileText size="24" />
      </div>
      <span class="tab-label">투자일지</span>
    </RouterLink>
    <RouterLink to="/market" class="tab-item">
      <div class="tab-icon">
        <ChartCandlestick size="24" />
      </div>
      <span class="tab-label">투자종목</span>
    </RouterLink>
    <RouterLink to="/home" class="tab-item tab-item--home">
      <div class="tab-icon">
        <Home size="24" />
      </div>
      <span class="tab-label">홈</span>
    </RouterLink>
    <RouterLink to="/study" class="tab-item">
      <div class="tab-icon">
        <GraduationCap size="24" />
      </div>
      <span class="tab-label">투자공부</span>
    </RouterLink>
    <RouterLink to="/mypage" class="tab-item">
      <div class="tab-icon">
        <User size="24" />
      </div>
      <span class="tab-label">마이페이지</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { Home, FileText, ChartCandlestick, GraduationCap, User } from 'lucide-vue-next'
</script>
<style scoped>
.tab-bar {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: white;
  border-top: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #7a7388;
  flex: 1;
}

.tab-item:hover {
  background: #f7f6fb;
}

.tab-item.router-link-active {
  color: #7c5cff;
}

.tab-icon {
  width: 26px;
  height: 26px;
}

.tab-icon.router-link-active {
  color: #7c5cff;
}
.tab-label {
  font-size: 10px;
  font-weight: 700;
}
</style>
