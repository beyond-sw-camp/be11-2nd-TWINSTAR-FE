<template>
  <div v-if="!notFound" class="profile-container">
    <div class="profile-header">
      <div class="profile-image-container">
        <img 
          :src="profile.profileImg || '/images/default-profile.png'" 
          alt="Profile" 
          class="profile-image"
          @error="handleImageError"
        />
        <div class="image-upload-overlay" @click="triggerImageUpload">
          <v-icon>mdi-camera</v-icon>
        </div>
        <input
          type="file"
          ref="imageInput"
          accept="image/*"
          style="display: none"
          @change="handleImageUpload"
        />
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
          <div class="stat-item" @click="showFollowerList" style="cursor: pointer;">
            <span class="stat-value">{{ profile.followerCount }}</span>
            <span class="stat-label">팔로워</span>
          </div>
          <div class="stat-item" @click="showFollowingList" style="cursor: pointer;">
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
      <div v-for="post in profile.posts" 
           :key="post.postId" 
           class="post-item"
           @click="goToPostDetail(post.postId)"
           style="cursor: pointer;"
      >
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

    <!-- 팔로워/팔로잉 모달 -->
    <FollowListModal 
      v-if="showFollowModal"
      :type="followModalType"
      @close="showFollowModal = false"
    />
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
import FollowListModal from '@/components/FollowListModal.vue'

export default {
  name: 'UserProfile',
  components: {
    NotFound,
    FollowListModal
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
      },
      showFollowModal: false,
      followModalType: 'followers'
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
      const file = event.target.files[0];
      if (!file) return;

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
        
        if (response.data && response.data.result) {
          this.profile.profileImg = response.data.result;
          await this.loadProfile(); // 프로필 새로고침
        }
      } catch (error) {
        console.error('이미지 업로드 실패:', error);
        alert('이미지 업로드에 실패했습니다.');
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
    },
    showFollowerList() {
      this.followModalType = 'followers'
      this.showFollowModal = true
    },
    showFollowingList() {
      this.followModalType = 'following'
      this.showFollowModal = true
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
/* 기본 프로필 컨테이너 스타일 */
.profile-container {
  max-width: 935px;
  margin: 0 auto;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center; /* 컨테이너 내용 중앙 정렬 */
}

.profile-header {
  display: flex;
  gap: 30px;  /* 80px에서 30px로 줄임 */
  margin-bottom: 44px;
  padding: 0 20px;
  align-items: center;  /* 중앙 정렬 추가 */
}

.profile-image-container {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 30px;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
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
}

.profile-top h2 {
  font-size: 20px;  /* 28px에서 20px로 줄임 */
  font-weight: 400;  /* 300에서 400으로 변경 */
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
}

.stat-item {
  display: flex;
  gap: 5px;
  align-items: center;
  transition: opacity 0.2s;
}

.stat-item:hover {
  opacity: 0.7;
}

.stat-value {
  font-weight: 500;  /* 600에서 500으로 변경 */
}

.stat-label {
  color: #262626;
}

.profile-bio {
  font-size: 14px;  /* 글씨 크기 추가 */
  line-height: 1.5;  /* 줄 간격 추가 */
  color: #262626;
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
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;  /* 3px에서 28px로 변경 */
  padding: 0 20px;  /* 패딩 추가 */
  max-width: 935px;
  width: 100%;
  margin: 40px auto 0;  /* 상단 마진 추가 */
}

.post-item {
  position: relative;
  width: 100%;
  padding-bottom: 100%;  /* 1:1 비율 유지 */
  background-color: #fafafa;  /* 배경색 추가 */
}

.post-item img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 3px;  /* 모서리 둥글게 */
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
  border-radius: 3px;  /* 오버레이도 둥글게 */
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

.image-upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;    /* 전체 이미지 영역 커버 */
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
  border-radius: 50%;  /* 원형 오버레이 */
}

.image-upload-overlay:hover {
  opacity: 1;
}

.image-upload-overlay .v-icon {
  color: white;
  font-size: 24px;
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

/* 태블릿 크기 (1024px 이하) */
@media screen and (max-width: 1024px) {
  .profile-container {
    width: calc(100% - 240px);
    margin-left: 240px;
    padding: 20px;
    overflow-x: hidden;
  }

  .profile-header {
    padding: 0 20px;
    gap: 40px;
  }

  .posts-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    padding: 0 20px;
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
    margin: 0;
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

  .posts-grid {
    gap: 3px;  /* 모바일에서는 간격 줄임 */
    padding: 0;
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

  .posts-grid {
    gap: 1px;  /* 더 작은 화면에서는 간격 더 줄임 */
  }
}
</style> 