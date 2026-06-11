<template>
  <div class="signupcomplete">
    <div class="container">
      <img src="/src/assets/completeSignup.svg" />
      <div class="textcontainer">
        <h1 class="title">가입 완료! 🌱</h1>
        <div class="message">
          <span class="username">{{ username }}</span
          >님,<br />seedit과 함께 첫 투자를 시작해볼까요?
        </div>
      </div>
      <div class="seed-money">
        <div class="clockbox">
          <Clock size="15" color="white" />
        </div>
        <div class="seedtext">
          <div class="seed-text-title">가입 축하 시드머니</div>
          <div class="seed-text-money">5,000,000원</div>
        </div>
      </div>
    </div>
    <footer class="footer">
      <button type="button" class="primary" @click="onClick">로그인하러 가기</button>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Clock } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
username.value = '새싹이'

const onClick = () => {
  router.push('/login')
}
</script>

<style>
.container {
  display: flex;
  padding: 130px 24px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 27px;
  flex: 1 0 0;
  align-self: stretch;
}

.title {
  color: var(--Mirage, var(--color-blue-14, #1e1a2e));
  text-align: center;

  font-weight: var(--font-weight-700, 700);
}

.textcontainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--item-spacing-xs, 8px);

  .message {
    text-align: center;
    color: var(--Mulled-Wine, var(--color-violet-31, #4a4459));
    font-size: 13.9px;
    font-style: normal;
    font-weight: 400;
    line-height: var(--line-height-22_5, 22.5px);
    letter-spacing: var(--letter-spacing--0_19, -0.192px);
  }

  .username {
    color: var(--Cornflower-Blue, var(--color-blue-68, #7c5cff));
    text-align: center;
    font-weight: 600;
  }
}
.seed-money {
  display: flex;
  padding: 16px 18px;
  align-items: center;
  gap: var(--item-spacing-14, 14px);
  border-radius: 20px;
  background: var(--color-grey-97, #f2eeff);
  align-self: stretch;

  .clockbox {
    display: flex;
    width: 44px;
    height: 44px;
    justify-content: center;
    align-items: center;
    border-radius: 12px;
    background: var(--color-blue-68, #7c5cff);
  }

  .seedtext {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--stroke-weight-2, 2px);
    flex: 1 0 0;
    line-height: var(--line-height-20_25, 20.25px); /* 135% */
    letter-spacing: var(--letter-spacing--0_19, -0.192px);

    .seed-text-title {
      color: var(--Meteorite, var(--color-blue-29, #2b1b7a));
      font-size: var(--font-size-15, 15px);
      font-weight: var(--font-weight-600, 600);
    }

    .seed-text-money {
      color: var(--Cornflower-Blue, var(--color-blue-68, #7c5cff));
      font-size: 19.7px;
      font-weight: var(--font-weight-700, 700);
    }
  }
}
.primary {
  height: 54px;
  border-radius: 16px;
  background: #7c5cff;
  color: white;
  font-size: 16px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  margin-top: 4px;
  transition:
    opacity 0.15s,
    transform 0.08s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Pretendard;
}
.primary:active {
  transform: scale(0.98);
}
.primary:disabled {
  opacity: 0.6;
  cursor: default;
}
.footer {
  display: flex;
  padding: 12px;
  flex-direction: column;
  align-self: stretch;
}
</style>
