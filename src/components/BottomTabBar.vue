<template>
  <nav class="tab-bar">
    <RouterLink to="/diary" class="tab-item">
      <span class="tab-icon">📝</span>
      <span class="tab-label">투자일지</span>
    </RouterLink>
    <RouterLink to="/stocks" class="tab-item">
      <span class="tab-icon">📈</span>
      <span class="tab-label">투자종목</span>
    </RouterLink>
    <RouterLink to="/home" class="tab-item tab-item--home">
      <span class="tab-icon">🏠</span>
      <span class="tab-label">홈</span>
    </RouterLink>
    <RouterLink to="/study" class="tab-item">
      <span class="tab-icon">📚</span>
      <span class="tab-label">투자공부</span>
    </RouterLink>
    <RouterLink to="/mypage" class="tab-item">
      <span class="tab-icon">👤</span>
      <span class="tab-label">마이페이지</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tab-bar {
  position: fixed;
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
  gap: 2px;
  text-decoration: none;
  color: #9A97AE;
  flex: 1;
}

.tab-item.router-link-active {
  color: #7C5CFF;
}

.tab-icon {
  font-size: 22px;
}

.tab-label {
  font-size: 10px;
  font-weight: 700;
}
</style>
