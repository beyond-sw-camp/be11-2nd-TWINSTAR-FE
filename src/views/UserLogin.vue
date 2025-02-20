<template>
  <div class="login-container">
    <div class="login-box">
      <div class="logo-area">
        <h1>TwinStar</h1>
        <p class="subtitle">서비스를 이용하시려면 로그인해주세요.</p>
      </div>
      <form @submit.prevent="doLogin" class="login-form">
        <div class="form-group">
          <span class="error-message" v-if="emailError || loginError">{{ emailError || loginError }}</span>
          <input 
            type="email" 
            id="email"
            v-model="email"
            placeholder="이메일"
            required
            @blur="validateEmail"
            :class="{ 'error': emailError || loginError }"
          >
          <i class="fas fa-envelope"></i>
        </div>
        <div class="form-group">
          <input 
            :type="passwordVisible ? 'text' : 'password'"
            id="password"
            v-model="password"
            placeholder="비밀번호"
            required
            :class="{ 'error': loginError }"
          >
          <i class="fas fa-lock"></i>
          <i 
            :class="passwordVisible ? 'fas fa-eye-slash' : 'fas fa-eye'"
            class="password-toggle"
            @click="togglePassword"
          ></i>
        </div>
        <div class="form-options">
          <label class="remember-me">
            <input type="checkbox">
            <span>자동 로그인</span>
          </label>
          <a href="#" class="forgot-password">비밀번호 찾기</a>
        </div>
        <button type="submit" class="login-button">로그인</button>
        <div class="register-link">
          계정이 없으신가요? <router-link to="/user/create">회원가입</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default{
    data() {
        return {
            email: "",
            password: "",
            passwordVisible: false,
            emailError: "",
            loginError: ""
        }
    },
    methods: {
        togglePassword() {
            this.passwordVisible = !this.passwordVisible;
        },
        validateEmail() {
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
            if (!this.email) {
                this.emailError = "이메일을 입력해주세요.";
                return false;
            }
            if (!emailRegex.test(this.email)) {
                this.emailError = "올바른 이메일 형식이 아닙니다.";
                return false;
            }
            this.emailError = "";
            return true;
        },
        async doLogin() {
            this.loginError = ""; // 로그인 시도할 때마다 에러 메시지 초기화
            if (!this.validateEmail()) {
                console.log("이메일 유효성 검사 실패")
                return;
            }
            try {
                const loginData = {email:this.email, password:this.password};
                const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/user/doLogin`, loginData)
                const token = response.data.token
                const refreshToken = response.data.refreshToken
                localStorage.setItem('token', token)
                localStorage.setItem('refreshToken', refreshToken)
                window.location.href = '/';
            } catch (error) {
                this.loginError = "이메일 주소 및 비밀번호가 틀렸습니다.";
            }
        }
    }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f6f8ff;
  padding: 20px;
}

.login-box {
  background: white;
  padding: 50px 40px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 460px;
  position: relative;
  overflow: hidden;
}

.logo-area {
  text-align: center;
  margin-bottom: 40px;
}

h1 {
  color: #2d3748;
  font-size: 2.4rem;
  font-weight: 700;
  margin-bottom: 10px;
  background: linear-gradient(90deg, #4776E6, #8E54E9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #718096;
  font-size: 0.95rem;
}

.form-group {
  position: relative;
  margin-bottom: 20px;
  padding-top: 20px;
}

.form-group i:not(.password-toggle) {
  position: absolute;
  left: 15px;
  top: calc(50% + 10px);
  transform: translateY(-50%);
  color: #a0aec0;
  pointer-events: none;
  width: 20px;
  text-align: center;
  z-index: 2;
  font-size: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

input {
  width: 100%;
  padding: 15px 20px 15px 45px !important;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  line-height: normal;
  transition: all 0.3s ease;
  background: #f8fafc;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}

input.error {
  border-color: #e53e3e;
  background-color: #fff5f5;
}

input:focus {
  outline: none;
  border-color: #4776E6;
  background: white;
  box-shadow: 0 0 0 4px rgba(71, 118, 230, 0.1);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #718096;
  font-size: 0.9rem;
  white-space: nowrap;
}

.forgot-password {
  color: #4776E6;
  font-size: 0.9rem;
  text-decoration: none;
  transition: color 0.3s ease;
}

.forgot-password:hover {
  color: #8E54E9;
}

.login-button {
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(90deg, #4776E6, #8E54E9);
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(71, 118, 230, 0.2);
}

.login-button:active {
  transform: translateY(0);
}

.register-link {
  text-align: center;
  margin-top: 25px;
  color: #718096;
  font-size: 0.95rem;
}

.register-link a {
  color: #4776E6;
  text-decoration: none;
  font-weight: 600;
  margin-left: 5px;
}

.register-link a:hover {
  color: #8E54E9;
}

.password-toggle {
  position: absolute;
  right: 15px;
  top: calc(50% + 10px);
  transform: translateY(-50%);
  color: #a0aec0;
  cursor: pointer;
  transition: color 0.3s ease;
  z-index: 1;
  width: 20px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.password-toggle:hover {
  color: #4776E6;
}

.error-message {
  position: absolute;
  top: 0;
  left: 0;
  color: #e53e3e;
  font-size: 0.8rem;
  margin-bottom: 5px;
  display: block;
}

@media (max-width: 480px) {
  .login-box {
    padding: 40px 20px;
  }
  
  h1 {
    font-size: 2rem;
  }
}
</style>