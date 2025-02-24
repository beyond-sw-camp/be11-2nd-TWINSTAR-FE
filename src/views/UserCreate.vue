<template>
  <div class="signup-container">
    <div class="signup-box">
      <h2>회원가입</h2>
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
    background-color: #f5f5f5;
}

.signup-box {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    width: 100%;
    max-width: 400px;
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
    padding: 0.8rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    margin-top: 1rem;
}

.signup-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.signup-button:hover:not(:disabled) {
    background-color: #0056b3;
}
</style>