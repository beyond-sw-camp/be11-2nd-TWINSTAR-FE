<template>
  <div class="not-found">
    <i class="fas fa-exclamation-circle"></i>
    <h2>페이지를 찾을 수 없습니다</h2>
    <p>{{ message || '요청하신 페이지가 존재하지 않습니다.' }}</p>
    <button @click="goHome" class="home-button">
      홈으로 돌아가기
    </button>
  </div>
</template>

<script>
export default {
  name: 'NotFound',
  props: {
    message: String
  },
  methods: {
    goHome() {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 20px;
  text-align: center;
}

.not-found i {
  font-size: 48px;
  color: #8e8e8e;
  margin-bottom: 20px;
}

.not-found h2 {
  font-size: 24px;
  margin-bottom: 10px;
  color: #262626;
}

.not-found p {
  color: #8e8e8e;
  margin-bottom: 20px;
}

.home-button {
  padding: 8px 16px;
  background-color: #0095f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.home-button:hover {
  background-color: #0081d6;
}
</style> 