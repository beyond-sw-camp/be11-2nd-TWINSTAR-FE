<template>
  <div class="settings-container">
    <div class="settings-content">
      <div class="settings-section">
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
            <textarea 
              v-model="profileForm.profileTxt" 
              rows="3"
              :class="{ 'error': errors.profileTxt }"
            ></textarea>
            <span class="error-message" v-if="errors.profileTxt">{{ errors.profileTxt }}</span>
            <span class="char-count">{{ profileForm.profileTxt.length }}/150</span>
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
      }
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

      if (this.profileForm.profileTxt && this.profileForm.profileTxt.length > 150) {
        this.errors.profileTxt = '소개는 150자를 초과할 수 없습니다.';
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
  justify-content: center; /* 중앙 정렬 추가 */
  padding: 40px 20px; /* 상하 여백 추가 */
}

.settings-content {
  width: 100%;
  max-width: 600px; /* 최대 너비 설정 */
  padding: 0 20px;
}

.settings-section {
  background: white;
  border-radius: 8px;
  padding: 30px;
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

.change-photo-btn {
  background: linear-gradient(to right, #4776E6, #8E54E9);  
  color: white;
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
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  font-size: 14px;
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
  right: 8px;
  bottom: 8px;
  font-size: 12px;
  color: #8e8e8e;
}

.submit-button {
  background: linear-gradient(to right, #4776E6, #8E54E9);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
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

/* 반응형 스타일 수정 */
@media (max-width: 992px) {
  .settings-content {
    margin-left: 0;
    padding: 20px;
  }
}

@media (max-width: 576px) {
  .settings-container {
    padding: 20px 10px;
  }

  .settings-section {
    padding: 20px;
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
</style> 