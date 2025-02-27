<template>
  <div class="settings-container">
    <div class="settings-sidebar">
      <h2>설정</h2>
      <div class="settings-nav">
        <div 
          class="settings-item" 
          :class="{ active: selectedMenu === 0 }"
          @click="selectedMenu = 0"
        >
          <i class="fas fa-user"></i>
          프로필 편집
        </div>
        <div 
          class="settings-item" 
          :class="{ active: selectedMenu === 1 }"
          @click="selectedMenu = 1"
        >
          <i class="fas fa-lock"></i>
          계정공개범위
        </div>
      </div>
    </div>

    <div class="settings-content">
      <div v-if="selectedMenu === 0" class="settings-section">
        <div class="profile-edit-header">
          <div class="profile-photo">
            <img 
              :src="profile.profileImg || '/images/default-profile.png'" 
              @error="handleImageError" 
              alt="프로필 사진"
            >
            <div class="photo-overlay" @click="triggerImageUpload">
              <i class="fas fa-camera"></i>
            </div>
          </div>
          <input
            type="file"
            ref="imageInput"
            accept="image/*"
            style="display: none"
            @change="handleImageUpload"
          >
          <div class="photo-actions">
            <button class="change-photo-btn" @click="triggerImageUpload">
              <i class="fas fa-camera"></i>
              프로필 사진 바꾸기
            </button>
            <button class="remove-photo-btn" @click="removeProfilePhoto">
              <i class="fas fa-trash"></i>
              현재 사진 삭제
            </button>
          </div>
        </div>

        <form @submit.prevent="saveProfile" class="profile-form">
          <div class="form-group">
            <label>닉네임</label>
            <input 
              v-model="profileForm.nickName" 
              type="text"
              :class="{ 'error': errors.nickName }"
            >
            <span class="error-message" v-if="errors.nickName">{{ errors.nickName }}</span>
          </div>

          <div class="form-group">
            <label>소개</label>
            <div class="textarea-container">
              <textarea
                v-model="profileForm.profileTxt"
                :maxlength="maxIntroLength"
                rows="5"
                placeholder="자기소개를 입력하세요"
                :class="{ 'error': errors.profileTxt }"
              ></textarea>
              <span class="char-count">{{ profileForm.profileTxt.length }}/{{ maxIntroLength }}</span>
            </div>
            <span class="error-message" v-if="errors.profileTxt">{{ errors.profileTxt }}</span>
          </div>

          <div class="form-group">
            <label>성별</label>
            <select v-model="profileForm.sex">
              <option value="MAN">남성</option>
              <option value="WOMAN">여성</option>
            </select>
          </div>

          <div class="form-group">
            <label>계정 공개 범위</label>
            <select v-model="profileForm.idVisibility">
              <option value="ALL">전체 공개</option>
              <option value="FOLLOW">팔로워만</option>
              <option value="ONLYME">비공개</option>
            </select>
          </div>

          <button type="submit" class="submit-button">제출</button>
        </form>
      </div>

      <div v-if="selectedMenu === 1" class="settings-section">
        <h3>계정 공개 범위</h3>
        <div class="privacy-settings">
          <div class="privacy-option">
            <label>
              <input 
                type="radio" 
                v-model="profile.idVisibility" 
                value="ALL"
              > 전체 공개
            </label>
          </div>
          <div class="privacy-option">
            <label>
              <input 
                type="radio" 
                v-model="profile.idVisibility" 
                value="FOLLOW"
              > 팔로워만
            </label>
          </div>
          <div class="privacy-option">
            <label>
              <input 
                type="radio" 
                v-model="profile.idVisibility" 
                value="ONLYME"
              > 나만 보기
            </label>
          </div>
          <button class="save-btn" @click="savePrivacy">저장</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export default {
  name: 'SettingsView',
  data() {
    return {
      selectedMenu: 0,
      settingsMenu: [
        { title: '프로필 편집', icon: 'fas fa-user-edit' },
        { title: '계정 공개 범위', icon: 'fas fa-lock' }
      ],
      profile: {
        nickName: '',
        profileImg: '',
        profileTxt: '',
        idVisibility: 'ALL',
        sex: 'MAN'
      },
      blockedUsers: [],
      profileForm: {
        nickName: '',
        profileTxt: '',
        idVisibility: 'ALL',
        sex: 'MAN'
      },
      errors: {
        nickName: '',
        profileTxt: ''
      },
      maxIntroLength: 150
    }
  },
  computed: {
    isFormValid() {
      return this.profileForm.nickName.length > 0 && 
             !this.errors.nickName && 
             !this.errors.profileTxt;
    }
  },
  methods: {
    async loadProfile() {
      try {
        const token = localStorage.getItem('token');
        const decoded = jwtDecode(token);
        const userId = decoded.sub;

        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/user/detail/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.status_code === 200) {
          const profileData = response.data.result;
          this.profile = {
            nickName: profileData.nickName,
            profileImg: profileData.profileImg,
            profileTxt: profileData.profileTxt,
            idVisibility: profileData.idVisibility,
            sex: profileData.sex
          };
          
          // 편집 폼 초기화
          this.initEditForm();
        }
      } catch (error) {
        console.error('프로필 로드 실패:', error);
        if (error.response?.status === 401) {
          this.$router.push('/user/login');
        }
      }
    },
    initEditForm() {
      this.profileForm = {
        nickName: this.profile.nickName,
        profileTxt: this.profile.profileTxt,
        idVisibility: this.profile.idVisibility,
        sex: this.profile.sex
      };
    },
    async saveProfile() {
      if (!this.validateForm()) {
        return;
      }

      try {
        // 요청 데이터 구조 수정
        const profileData = {
          nickName: this.profileForm.nickName,
          profileTxt: this.profileForm.profileTxt || '', // null 방지
          idVisibility: this.profileForm.idVisibility || 'ALL', // 기본값 설정
          sex: this.profileForm.sex || 'MAN' // 기본값 설정
        };

        console.log('전송할 프로필 데이터:', profileData); // 디버깅용

        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/user/profile/text`,
          profileData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.status_code === 200) {
          // 프로필 정보 업데이트
          this.profile = {
            ...this.profile,
            ...this.profileForm
          };

          alert('프로필이 성공적으로 수정되었습니다.');
          
          // MyProfile 페이지로 리다이렉트
          const userId = jwtDecode(localStorage.getItem('token')).sub;
          this.$router.push(`/profile/${userId}`);
        } else {
          throw new Error(response.data.message || '프로필 수정에 실패했습니다.');
        }
      } catch (error) {
        console.error('프로필 수정 실패:', error);
        if (error.response?.data?.message) {
          alert(error.response.data.message);
        } else {
          alert('프로필 수정에 실패했습니다.');
        }
      }
    },
    async savePrivacy() {
      try {
        await axios.put(`${process.env.VUE_APP_API_BASE_URL}/user/privacy`, {
          idVisibility: this.profile.idVisibility
        });
        alert('공개 범위가 변경되었습니다.');
      } catch (error) {
        console.error('공개 범위 변경 실패:', error);
        alert('공개 범위 변경에 실패했습니다.');
      }
    },
    async loadBlockedUsers() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/user/blocked`);
        this.blockedUsers = response.data.result;
      } catch (error) {
        console.error('차단 목록 로드 실패:', error);
      }
    },
    async unblockUser(userId) {
      try {
        await axios.post(`${process.env.VUE_APP_API_BASE_URL}/user/unblock/${userId}`);
        await this.loadBlockedUsers();
        alert('차단이 해제되었습니다.');
      } catch (error) {
        console.error('차단 해제 실패:', error);
        alert('차단 해제에 실패했습니다.');
      }
    },
    async handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB를 초과할 수 없습니다.');
        return;
      }

      // 이미지 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/user/profile/img`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        if (response.data.status_code === 200) {
          this.profile.profileImg = response.data.result;
          await this.loadProfile();
          alert('프로필 사진이 성공적으로 변경되었습니다.');
        } else {
          throw new Error('프로필 사진 업로드에 실패했습니다.');
        }
      } catch (error) {
        console.error('이미지 업로드 중 오류 발생:', error);
        
        // 실제 서버 응답 에러인 경우에만 에러 메시지 표시
        if (!this.profile.profileImg.includes(file.name)) {
          alert('이미지 업로드에 실패했습니다.');
        }
      }
    },
    async removeProfilePhoto() {
      try {
        await axios.delete(
          `${process.env.VUE_APP_API_BASE_URL}/user/profile/img`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        this.profile.profileImg = '/images/default-profile.png';
      } catch (error) {
        console.error('프로필 사진 삭제 실패:', error);
        alert('프로필 사진 삭제에 실패했습니다.');
      }
    },
    validateForm() {
      this.errors = {
        nickName: '',
        profileTxt: ''
      };

      if (!this.profileForm.nickName) {
        this.errors.nickName = '닉네임을 입력해주세요.';
      } else if (this.profileForm.nickName.length > 20) {
        this.errors.nickName = '닉네임은 20자를 초과할 수 없습니다.';
      }

      if (this.profileForm.profileTxt && this.profileForm.profileTxt.length > this.maxIntroLength) {
        this.errors.profileTxt = `자기소개는 ${this.maxIntroLength}자를 초과할 수 없습니다.`;
      }

      return !this.errors.nickName && !this.errors.profileTxt;
    },
    handleImageError() {
      // 이미지 로드 실패 처리
      console.error('이미지 로드 실패');
    },
    triggerImageUpload() {
      this.$refs.imageInput.click();
    }
  },
  created() {
    // URL query parameter에서 tab 확인
    if (this.$route.query.tab === 'profile') {
      this.selectedMenu = 0;  // 프로필 편집 탭 선택
    }
    this.loadProfile();
    this.loadBlockedUsers();
  }
}
</script>

<style scoped>
.settings-container {
  display: flex;
  min-height: 100vh;
  background-color: white;
  width: 100%;
}

.settings-sidebar {
  width: 30%; /* 픽셀 대신 퍼센트 사용 */
  max-width: 240px;
  min-width: 200px;
  border-right: 1px solid #dbdbdb;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  left: var(--header-width, 240px);
  background: white;
  z-index: 999;
}

.settings-sidebar h2 {
  padding: 0 20px;
  margin-bottom: 20px;
}

.settings-nav {
  display: flex;
  flex-direction: column;
}

.settings-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  cursor: pointer;
  gap: 12px;
}

.settings-item:hover {
  background-color: #fafafa;
}

.settings-item.active {
  font-weight: 600;
  background-color: #fafafa;
}

.settings-item i {
  width: 20px;
}

.settings-content {
  flex: 1;
  padding: 40px;
  margin-left: 580px; /* 사이드바 너비만큼 마진 */
}

.settings-section {
  max-width: 600px;
}

.profile-edit-header {
  margin-bottom: 32px;
}

.profile-photo {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 20px;
}

.profile-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
}

.photo-overlay:hover {
  opacity: 1;
}

.photo-overlay i {
  color: white;
  font-size: 24px;
}

.photo-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.change-photo-btn,
.remove-photo-btn {
  width: 500px;
  border-radius: 15px;
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;  /* 텍스트 중앙 정렬을 위해 추가 */
}

.change-photo-btn {
  background: linear-gradient(to right, #4776E6, #8E54E9);  
  color: white;
  border: none;
}

.remove-photo-btn {
  background: none;
  background-image: linear-gradient(to right, #FF416C, #FF4B2B);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  border: none;
}

.form-group {
  margin-bottom: 20px;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 500px;
  padding: 8px 12px;
  border: 1px solid #dbdbdb;
  border-radius: 15px;
  font-size: 14px;
}

.form-group textarea {
  width: 500px;
  min-width: 500px;
  max-width: 500px;
  padding: 8px 12px;
  padding-bottom: 30px;  /* 글자수 카운터를 위한 하단 여백 추가 */
  border: 1px solid #dbdbdb;
  border-radius: 15px;
  font-size: 14px;
  position: relative;  /* 부모 요소에 relative 설정 */
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #8e8e8e;
}

.error {
  border-color: #ed4956 !important;
}

.error-message {
  color: #ed4956;
  font-size: 12px;
  margin-top: 4px;
}

.char-count {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 12px;
  color: #8e8e8e;
}

.submit-button {
  background: linear-gradient(to right, #4776E6, #8E54E9);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 15px;
  font-weight: 600;
  cursor: pointer;
}

.submit-button:hover {
  background-color: #0081d6;
}

.privacy-option {
  margin-bottom: 15px;
}

.blocked-user {
  display: flex;
  align-items: center;
  padding: 10px 0;
  gap: 15px;
}

.blocked-user img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.blocked-user button {
  margin-left: auto;
  padding: 6px 12px;
  border: none;
  background-color: #dc3545;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.no-blocked {
  color: #8e8e8e;
  text-align: center;
  padding: 20px;
}

.save-btn {
  background-color: #0095f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn:hover {
  background-color: #0081d6;
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 태블릿 이하 화면 크기 */
@media (max-width: 992px) {
  .settings-sidebar {
    width: 100%;
    height: auto;
    position: relative;
    border-right: none;
    border-bottom: 1px solid #dbdbdb;
  }

  .settings-nav {
    flex-direction: row;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  .settings-content {
    margin-left: 0;
    padding: 20px;
  }

  .settings-item {
    padding: 10px 15px;
  }
}

/* 모바일 화면 */
@media (max-width: 576px) {
  .settings-container {
    flex-direction: column;
  }

  .settings-content {
    padding: 15px;
  }

  .profile-photo {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .photo-actions {
    width: 100%;
    align-items: center;
  }

  .form-group {
    flex-direction: column;
  }

  .char-count {
    position: static;
    text-align: right;
    margin-top: 5px;
  }
}

.textarea-container {
  position: relative;
  width: 500px;
}

.textarea-container textarea {
  width: 100%;
  min-width: 500px;
  max-width: 500px;
  padding: 8px 12px;
  padding-bottom: 30px;
  border: 1px solid #dbdbdb;
  border-radius: 15px;
  font-size: 14px;
}

.char-count {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 12px;
  color: #8e8e8e;
}
</style> 