<template>
  <div class="signup-container">
    <div class="signup-box">
      <div class="logo-area">
        <h1>TwinStar</h1>
        <p class="subtitle">회원 정보를 입력해주세요</p>
    </div>
      <form @submit.prevent="create" class="signup-form">
        <div class="form-group">
          <label>이메일</label>
          <input 
            type="email" 
            v-model="email" 
            @input="checkEmailDuplicate"
            :class="{ 'is-invalid': (!isEmailValid && email) || emailDuplicate }"
            placeholder="이메일을 입력하세요"
          >
          <span class="error-message" v-if="!isEmailValid && email">
            올바른 이메일 형식이 아닙니다
          </span>
          <span class="error-message" v-if="emailDuplicate">
            이미 사용 중인 이메일입니다
          </span>
        </div>

        <div class="form-group">
          <label>비밀번호</label>
          <input 
            type="password" 
            v-model="password"
            :class="{ 'is-invalid': !isPasswordValid && password }"
            placeholder="비밀번호를 입력하세요"
          >
          <span class="error-message" v-if="!isPasswordValid && password">
            비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다
          </span>
        </div>

        <div class="form-group">
          <label>비밀번호 확인</label>
          <input 
            type="password" 
            v-model="passwordConfirm"
            :class="{ 'is-invalid': !isPasswordMatch && passwordConfirm }"
            placeholder="비밀번호를 다시 입력하세요"
          >
          <span class="error-message" v-if="!isPasswordMatch && passwordConfirm">
            비밀번호가 일치하지 않습니다
          </span>
        </div>

        <div class="form-group">
          <label>닉네임</label>
          <input 
            type="text" 
            v-model="nickname"
            @input="checkNicknameDuplicate"
            :class="{ 'is-invalid': nicknameDuplicate }"
            placeholder="닉네임을 입력하세요"
          >
          <span class="error-message" v-if="nicknameDuplicate">
            이미 사용 중인 닉네임입니다
          </span>
        </div>

        <div class="form-group">
          <label>성별</label>
          <select v-model="sex">
            <option value="">선택하세요</option>
            <option value="MAN">남성</option>
            <option value="WOMAN">여성</option>
          </select>
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
            nicknameCheckTimeout: null  // 디바운스를 위한 타이머
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
        }
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

h2 {
    text-align: center;
    color: #333;
    margin-bottom: 2rem;
}

.form-group {
    margin-bottom: 1rem;
}

label {
    display: block;
    margin-bottom: 0.5rem;
    color: #666;
}

input, select {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
}

input.is-invalid {
    border-color: #dc3545;
    background-color: #fff;
}

input.is-invalid:focus {
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.error-message {
    color: #dc3545;
    font-size: 0.8rem;
    margin-top: 0.25rem;
    display: block;
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
}

.signup-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.signup-button:hover:not(:disabled) {
    background-color: #0056b3;
}
</style>