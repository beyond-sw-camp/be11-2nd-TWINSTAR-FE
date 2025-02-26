<template>
  <div v-if="!notFound" class="profile-container">
    <div class="profile-header">
      <div class="profile-image">
        <img 
          :src="profile.profileImg || '/images/default-profile.png'" 
          @error="handleImageError"
          alt="프로필 이미지"
        >
        <div v-if="isMyProfile" class="image-overlay" @click="triggerImageUpload">
          <i class="fas fa-camera"></i>
          <span>프로필 사진 변경</span>
        </div>
        <input
          type="file"
          ref="imageInput"
          accept="image/*"
          style="display: none"
          @change="handleImageUpload"
        >
      </div>
      <div class="profile-info">
        <div class="profile-top">
          <h2>{{ profile.nickName }}</h2>
          <div class="profile-actions">
            <button v-if="isMyProfile" @click="goToSettings" class="edit-button">
              프로필 편집
            </button>
            <button v-else @click="toggleFollow" class="follow-button" :class="{ 'following': isFollowing }">
              {{ isFollowing ? '팔로잉' : '팔로우' }}
            </button>
          </div>
        </div>
        
        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-value">{{ profile.posts?.length || 0 }}</span>
            <span class="stat-label">게시물</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ profile.followerCount }}</span>
            <span class="stat-label">팔로워</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ profile.followingCount }}</span>
            <span class="stat-label">팔로잉</span>
          </div>
        </div>
        
        <div class="profile-bio">
          <p>{{ profile.profileTxt }}</p>
        </div>
      </div>
    </div>

    <div v-if="canViewPosts" class="posts-grid">
      <div v-for="post in profile.posts" :key="post.postId" class="post-item">
        <img 
          :src="post.imageUrl || '/images/default-post.png'" 
          @error="handleImageError"
          alt="게시물"
        >
        <div class="post-overlay">
          <div class="post-stats">
            <div class="stat">
              <i class="fas fa-heart"></i>
              <span>{{ post.likeCount }}</span>
            </div>
            <div class="stat">
              <i class="fas fa-comment"></i>
              <span>{{ post.commentCount }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="private-account">
      <i class="fas fa-lock"></i>
      <p>이 계정은 비공개 계정입니다.</p>
      <p v-if="!isMyProfile">팔로우하여 게시물을 확인하세요.</p>
    </div>

    <div v-if="showEditModal" class="modal-overlay" @click="showEditModal = false">
      <div class="modal-content" @click.stop>
        <h3>프로필 편집</h3>
        <form @submit.prevent="updateProfile">
          <div class="form-group">
            <label>닉네임</label>
            <input v-model="editForm.nickName" type="text" required>
          </div>
          <div class="form-group">
            <label>소개</label>
            <textarea v-model="editForm.profileTxt" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>공개 범위</label>
            <select v-model="editForm.idVisibility">
              <option value="ALL">전체 공개</option>
              <option value="FOLLOW">팔로워만</option>
              <option value="ONLYME">비공개</option>
            </select>
          </div>
          <div class="form-group">
            <label>성별</label>
            <select v-model="editForm.sex">
              <option value="MALE">남성</option>
              <option value="FEMALE">여성</option>
              <option value="OTHER">기타</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showEditModal = false">취소</button>
            <button type="submit" class="save-button">저장</button>
          </div>
        </form>
      </div>
    </div>
  </div>
  <NotFound 
    v-else 
    message="존재하지 않는 사용자입니다."
  />
</template>

<script>
import { jwtDecode } from 'jwt-decode'
import axios from 'axios'
import NotFound from '@/components/NotFound.vue'

export default {
  name: 'UserProfile',
  components: {
    NotFound
  },
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      profile: {
        id: null,
        nickName: '',
        profileImg: '',
        profileTxt: '',
        followerCount: 0,
        followingCount: 0,
        idVisibility: 'ALL',
        posts: []
      },
      isFollowing: false,
      notFound: false,
      showEditModal: false,
      editForm: {
        nickName: '',
        profileTxt: '',
        idVisibility: 'ALL',
        sex: 'OTHER'
      }
    }
  },
  computed: {
    isMyProfile() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return false;
        
        const decoded = jwtDecode(token);
        return this.id === decoded.sub.toString(); // 문자열로 비교
      } catch (error) {
        console.error('프로필 체크 에러:', error);
        return false;
      }
    },
    canViewPosts() {
      return this.isMyProfile || 
             this.profile.idVisibility === 'ALL' || 
             (this.profile.idVisibility === 'FOLLOW' && this.isFollowing)
    }
  },
  methods: {
    async loadProfile() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/user/login');
          return;
        }

        const userId = parseInt(this.id);
        console.log('프로필 요청 userId:', userId);
        
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/user/detail/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('프로필 응답:', response.data);
        
        if (response.data && response.data.result) {
          const result = response.data.result;
          
          // 프로필 이미지 URL 처리
          const profileImg = result.profileImg 
            ? (result.profileImg.startsWith('http') 
              ? result.profileImg 
              : `${process.env.VUE_APP_API_BASE_URL}${result.profileImg}`)
            : '/images/default-profile.png';
            
          // 게시물 이미지 URL 처리 추가
          const posts = result.posts?.map(post => ({
            ...post,
            imageUrl: post.imageUrl
              ? (post.imageUrl.startsWith('http')
                ? post.imageUrl
                : `${process.env.VUE_APP_API_BASE_URL}${post.imageUrl}`)
              : '/images/default-post.png'
          })) || [];
          
          this.notFound = false;
          this.profile = {
            ...result,
            profileImg,
            posts  // 수정된 게시물 배열로 업데이트
          };
          
          if (!this.isMyProfile) {
            await this.checkFollowStatus();
          }
        }
      } catch (error) {
        console.error('프로필 로딩 에러:', error);
        if (error.response?.status === 404) {
          this.notFound = true;
        } else if (error.response?.status === 401) {
          this.$router.push('/user/login');
        } else {
          alert('프로필을 불러오는데 실패했습니다.');
        }
      }
    },
    async checkFollowStatus() {
      try {
        const token = localStorage.getItem('token');
        const userId = parseInt(this.id);
        
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/follow/check/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('팔로우 상태 응답:', response.data);
        this.isFollowing = response.data.result;
      } catch (error) {
        console.error('팔로우 상태 확인 실패:', error);
      }
    },
    async toggleFollow() {
      try {
        const token = localStorage.getItem('token');
        const userId = parseInt(this.id);
        
        if (this.isFollowing) {
          await axios.delete(
            `${process.env.VUE_APP_API_BASE_URL}/follow/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              data: { userId }
            }
          );
        } else {
          await axios.post(
            `${process.env.VUE_APP_API_BASE_URL}/follow/${userId}`,
            { userId },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
        }
        this.isFollowing = !this.isFollowing;
        await this.loadProfile();
      } catch (error) {
        console.error('팔로우 토글 실패:', error);
        alert('팔로우 상태 변경에 실패했습니다.');
      }
    },
    goToSettings() {
      this.$router.push({
        path: '/settings',
        query: { tab: 'profile' }
      })
    },
    handleImageError(e) {
      e.target.src = '/images/default-profile.png'
    },
    triggerImageUpload() {
      this.$refs.imageInput.click()
    },
    async handleImageUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/user/profile/image`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        )
        this.profile.profileImg = response.data
        alert('프로필 이미지가 업데이트되었습니다.')
      } catch (error) {
        console.error('이미지 업로드 실패:', error)
        alert('이미지 업로드에 실패했습니다.')
      }
    },
    async updateProfile() {
      try {
        await axios.put(
          `${process.env.VUE_APP_API_BASE_URL}/user/profile/text`,
          this.editForm,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        )
        
        this.profile = {
          ...this.profile,
          ...this.editForm
        }
        
        this.showEditModal = false
        alert('프로필이 수정되었습니다.')
      } catch (error) {
        console.error('프로필 수정 실패:', error)
        alert('프로필 수정에 실패했습니다.')
      }
    },
    initEditForm() {
      this.editForm = {
        nickName: this.profile.nickName,
        profileTxt: this.profile.profileTxt,
        idVisibility: this.profile.idVisibility,
        sex: this.profile.sex
      }
    }
  },
  created() {
    console.log('Profile 컴포넌트 created');
    this.loadProfile();
  },
  mounted() {
    console.log('Profile 컴포넌트 mounted');
  },
  watch: {
    id: {
      handler(newId) {
        console.log('프로필 ID 변경:', newId);
        this.loadProfile();
      },
      immediate: true
    },
    profile: {
      handler() {
        if (this.isMyProfile) {
          this.initEditForm()
        }
      },
      immediate: true
    }
  }
}
</script>

<style scoped>
.profile-container {
  max-width: 935px;
  margin: 0 auto;
  padding: 30px 20px;
  margin-left: calc(240px + 20px); /* 헤더 너비 + 여백 */
}

.profile-header {
  display: flex;
  gap: 80px;
  margin-bottom: 44px;
  padding: 0 20px;
}

.profile-image {
  position: relative;
  width: 150px;
  height: 150px;
  flex-shrink: 0;
}

.profile-image img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-top {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap; /* 필요시 줄바꿈 */
}

.profile-top h2 {
  font-size: 28px;
  font-weight: 300;
  margin: 0;
}

.profile-actions {
  display: flex;
  gap: 10px;
}

.profile-stats {
  display: flex;
  gap: 40px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  gap: 5px;
  align-items: center;
}

.stat-value {
  font-weight: 600;
}

.stat-label {
  color: #262626;
}

.profile-bio {
  white-space: pre-line;
  max-width: 100%;
  word-break: break-word;
}

.edit-button, .follow-button {
  padding: 5px 9px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
}

.edit-button {
  background-color: transparent;
  border: 1px solid #dbdbdb;
}

.follow-button {
  background-color: #0095f6;
  color: white;
  border: none;
}

.follow-button.following {
  background-color: #efefef;
  color: #000;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3개의 동일한 크기 컬럼 */
  gap: 28px;
  margin-top: 40px;
  width: 100%;
  max-width: 935px; /* 최대 너비 설정 */
  margin-left: auto;
  margin-right: auto;
}

.post-item {
  aspect-ratio: 1; /* 정사각형 유지 */
  width: 100%;
  position: relative;
}

.post-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.post-item:hover .post-overlay {
  opacity: 1;
}

.post-stats {
  display: flex;
  gap: 30px;
  color: white;
}

.stat {
  display: flex;
  align-items: center;
  gap: 7px;
}

.private-account {
  text-align: center;
  padding: 40px;
  color: #8e8e8e;
}

.private-account i {
  font-size: 24px;
  margin-bottom: 16px;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.2s;
}

.image-overlay:hover {
  opacity: 1;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.save-button {
  background-color: #0095f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

/* 태블릿 크기에서의 조정 */
@media (max-width: 935px) {
  .posts-grid {
    gap: 15px;
    padding: 0 15px;
  }
}

/* 모바일 크기에서의 조정 */
@media (max-width: 735px) {
  .posts-grid {
    gap: 3px;
    padding: 0 3px;
  }
}

/* 태블릿 반응형 (768px ~ 1024px) */
@media screen and (max-width: 1024px) {
  .profile-container {
    margin-left: 20px;
    padding: 20px;
  }

  .profile-header {
    gap: 40px;
  }

  .profile-image {
    width: 120px;
    height: 120px;
  }
}

/* 모바일 반응형 (768px 이하) */
@media screen and (max-width: 768px) {
  .profile-container {
    margin-left: 0;
    padding: 15px;
  }

  .profile-header {
    flex-direction: column;
    align-items: center;
    gap: 30px;
    text-align: center;
  }

  .profile-image {
    width: 100px;
    height: 100px;
  }

  .profile-info {
    align-items: center;
  }

  .profile-stats {
    justify-content: center;
    width: 100%;
    gap: 20px;
  }

  .profile-bio {
    text-align: center;
  }

  .profile-actions {
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 10px;
  }

  .edit-button, 
  .follow-button {
    width: 100%;
    max-width: 250px;
  }
}

/* 작은 모바일 화면 (480px 이하) */
@media screen and (max-width: 480px) {
  .profile-container {
    padding: 10px;
  }

  .profile-header {
    gap: 20px;
  }

  .profile-stats {
    flex-wrap: wrap;
    justify-content: space-around;
  }

  .stat-item {
    flex: 0 0 auto;
    min-width: 80px;
  }
}
</style> 