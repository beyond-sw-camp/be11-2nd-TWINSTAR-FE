<template>
  <div class="signup-container">
    <div class="signup-box">
      <div class="logo-area">
        <img src="/logo.png" alt="Twinstar Logo" class="logo-image" style="max-width: 200px;">
        <p class="subtitle">회원 정보를 입력해주세요</p>
    </div>
      <form @submit.prevent="create" class="signup-form">
        <div class="form-group">
          <span class="error-message" v-if="!isEmailValid && email">
            올바른 이메일 형식이 아닙니다
          </span>
          <span class="error-message" v-if="emailDuplicate">
            이미 사용 중인 이메일입니다
          </span>
          <input 
            type="email" 
            v-model="email" 
            @input="checkEmailDuplicate"
            :class="{ 'error': (!isEmailValid && email) || emailDuplicate }"
            placeholder="이메일"
          >
          <i class="fas fa-envelope"></i>
        </div>

        <div class="form-group">
          <span class="error-message" v-if="!isPasswordValid && password">
            비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다
          </span>
          <input 
            :type="passwordVisible ? 'text' : 'password'"
            v-model="password"
            :class="{ 'error': !isPasswordValid && password }"
            placeholder="비밀번호"
          >
          <i class="fas fa-lock"></i>
          <i 
            :class="passwordVisible ? 'fas fa-eye-slash' : 'fas fa-eye'"
            class="password-toggle"
            @click="togglePassword"
          ></i>
        </div>

        <div class="form-group">
          <span class="error-message" v-if="!isPasswordMatch && passwordConfirm">
            비밀번호가 일치하지 않습니다
          </span>
          <input 
            :type="passwordConfirmVisible ? 'text' : 'password'"
            v-model="passwordConfirm"
            :class="{ 'error': !isPasswordMatch && passwordConfirm }"
            placeholder="비밀번호 확인"
          >
          <i class="fas fa-lock"></i>
        </div>

        <div class="form-group">
          <span class="error-message" v-if="nicknameDuplicate">
            이미 사용 중인 닉네임입니다
          </span>
          <input 
            type="text" 
            v-model="nickname"
            @input="checkNicknameDuplicate"
            :class="{ 'error': nicknameDuplicate }"
            placeholder="닉네임"
          >
          <i class="fas fa-user"></i>
        </div>

        <div class="form-group">
          <select v-model="sex" class="select-gender">
            <option value="">성별 선택</option>
            <option value="MAN">남성</option>
            <option value="WOMAN">여성</option>
          </select>
          <i class="fas fa-venus-mars"></i>
        </div>

        <button 
          type="submit" 
          :disabled="!isFormValid"
          class="signup-button"
        >
          가입하기
        </button>
        <div class="register-link">
          이미 계정이 있으신가요? <router-link to="/user/login">로그인</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
    data() {
        return {
            nickname: "",
            email: "",
            password: "",
            passwordConfirm: "",
            sex: "",
            emailDuplicate: false,
            nicknameDuplicate: false,
            emailCheckTimeout: null,  // 디바운스를 위한 타이머
            nicknameCheckTimeout: null,  // 디바운스를 위한 타이머
            passwordVisible: false,
            passwordConfirmVisible: false,
        }
    },
    computed: {
        isEmailValid() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            return emailRegex.test(this.email)
        },
        isPasswordValid() {
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
            return passwordRegex.test(this.password)
        },
        isPasswordMatch() {
            return this.password === this.passwordConfirm
        },
        isFormValid() {
            return this.isEmailValid && 
                   this.isPasswordValid && 
                   this.isPasswordMatch &&
                   this.nickname && 
                   this.sex &&
                   !this.emailDuplicate &&
                   !this.nicknameDuplicate
        }
    },
    methods: {
        checkEmailDuplicate() {
            clearTimeout(this.emailCheckTimeout);
            
            this.emailCheckTimeout = setTimeout(async () => {
                if (!this.email || !this.isEmailValid) {
                    this.emailDuplicate = false;
                    return;
                }
                
                try {
                    const response = await axios.get(
                        `${process.env.VUE_APP_API_BASE_URL}/user/check-email/${encodeURIComponent(this.email)}`,
                        { 
                            headers: {} // 인증 헤더 제거
                        }
                    );
                    console.log('이메일 중복 체크 응답:', response.data);
                    this.emailDuplicate = response.data.duplicate;
                    
                    if (this.emailDuplicate) {
                        console.log('중복된 이메일 감지됨');
                    }
                } catch (error) {
                    console.error('이메일 중복 체크 오류:', error);
                    this.emailDuplicate = false;
                }
            }, 500);
        },
        
        checkNicknameDuplicate() {
            clearTimeout(this.nicknameCheckTimeout);
            
            this.nicknameCheckTimeout = setTimeout(async () => {
                if (!this.nickname || this.nickname.length < 2) {
                    this.nicknameDuplicate = false;
                    return;
                }
                
                try {
                    const response = await axios.get(
                        `${process.env.VUE_APP_API_BASE_URL}/user/check-nickname/${encodeURIComponent(this.nickname)}`,
                        { 
                            headers: {} // 인증 헤더 제거
                        }
                    );
                    console.log('닉네임 중복 체크 응답:', response.data);
                    this.nicknameDuplicate = response.data.duplicate;
                    
                    if (this.nicknameDuplicate) {
                        console.log('중복된 닉네임 감지됨');
                    }
                } catch (error) {
                    console.error('닉네임 중복 체크 오류:', error);
                    this.nicknameDuplicate = false;
                }
            }, 500);
        },
        
        async create() {
            try {
                if (this.emailDuplicate || this.nicknameDuplicate) {
                    alert('중복된 이메일 또는 닉네임이 있습니다.');
                    return;
                }

                const data = {
                    email: this.email,
                    password: this.password,
                    nickName: this.nickname,
                    sex: this.sex,
                    idVisibility: "ALL",
                    userStatus: "ACTIVE",
                    profileImg: "logo.png",
                    profileTxt: "자기소개입니다."
                };
                
                const response = await axios.post(
                    `${process.env.VUE_APP_API_BASE_URL}/user/create`, 
                    data,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
                console.log('응답 데이터:', response.data);
                this.$router.push('/login');
            } catch(error) {
                console.error('회원가입 오류:', error);
                if (error.response?.data?.message) {
                    alert(error.response.data.message);
                } else {
                    alert('회원가입 중 오류가 발생했습니다.');
                }
            }
        },
        togglePassword() {
            this.passwordVisible = !this.passwordVisible;
        },
        togglePasswordConfirm() {
            this.passwordConfirmVisible = !this.passwordConfirmVisible;
        },
    },
    // 컴포넌트가 제거될 때 타이머 정리
    beforeUnmount() {
        clearTimeout(this.emailCheckTimeout);
        clearTimeout(this.nicknameCheckTimeout);
    }
}
</script>

<style scoped>
.signup-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f6f8ff;
  padding: 20px;
}

.signup-box {
  background: white;
  padding: 30px 40px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 460px;
  position: relative;
  overflow: hidden;
}

.logo-area {
  text-align: center;
  margin-bottom: 20px;
}

.logo-image {
  width: 200px !important;
  height: auto !important;
  max-width: 200px !important;
  display: block;
  margin: 0 auto 10px;
  object-fit: contain;
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

h2 {
    text-align: center;
    color: #333;
    margin-bottom: 2rem;
}

.form-group {
    position: relative;
    margin-bottom: 10px;
    padding-top: 12px;
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

input, select {
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

input:focus, select:focus {
    outline: none;
    border-color: #4776E6;
    background: white;
    box-shadow: 0 0 0 4px rgba(71, 118, 230, 0.1);
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

.error-message {
    position: absolute;
    top: 0;
    left: 0;
    color: #e53e3e;
    font-size: 0.8rem;
    margin-bottom: 5px;
    display: block;
}

.select-gender {
    padding-right: 30px !important;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a0aec0' d='M6 8.825L1.175 4 2.238 2.938 6 6.7l3.763-3.763L10.825 4z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 15px center;
}

.signup-button {
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
  margin-top: 30px;
}

.signup-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.signup-button:hover:not(:disabled) {
    background-color: #0056b3;
}
</style>