<template>
  <div class="profile-container">
    <div class="profile-header">
      <div class="profile-image">
        <img 
          :src="profile.profileImg || '/images/default-profile.png'" 
          @error="handleProfileImageError"
          alt="프로필 이미지"
        >
      </div>
      <div class="profile-info">
        <div class="profile-top">
          <h2>{{ profile.nickName }}</h2>
          <button @click="editProfile" class="edit-button">
            <i class="fas fa-edit"></i> 프로필 편집
          </button>
        </div>
        <div class="profile-stats">
          <div class="stat">
            <span class="count">{{ profile.posts?.length || 0 }}</span>
            <span class="label">게시물</span>
          </div>
          <div class="stat">
            <span class="count">{{ profile.followerCount || 0 }}</span>
            <span class="label">팔로워</span>
          </div>
          <div class="stat">
            <span class="count">{{ profile.followingCount || 0 }}</span>
            <span class="label">팔로잉</span>
          </div>
        </div>
        <p class="profile-text">{{ profile.profileTxt }}</p>
        <div class="visibility-info">
          <span>계정 공개 범위: {{ getVisibilityText(profile.idVisibility) }}</span>
        </div>
      </div>
    </div>

    <div class="posts-grid">
      <div v-for="post in profile.posts" :key="post.id" class="post-item">
        <img :src="post.imageUrl" :alt="post.content" @click="viewPost(post.id)">
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'MyProfile',
  data() {
    return {
      profile: {
        id: null,
        nickName: '',
        profileImg: '',
        profileTxt: '',
        followerCount: 0,
        followingCount: 0,
        idVisibility: '',
        posts: []
      }
    }
  },
  methods: {
    async loadProfile() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/user/myProfile`
        );
        
        console.log('프로필 응답 데이터:', response.data);  // 전체 응답 데이터 확인
        if (response.data && response.data.result) {
          this.profile = response.data.result;
        }
      } catch (error) {
        console.error('프로필 로딩 에러:', error);
        alert('프로필을 불러오는데 실패했습니다.');
      }
    },
    
    getVisibilityText(visibility) {
      const visibilityMap = {
        'ALL': '전체 공개',
        'FOLLOW': '팔로워만',
        'ONLYME': '나만 보기'
      };
      return visibilityMap[visibility] || '알 수 없음';
    },

    editProfile() {
      this.$router.push('/user/edit-profile');
    },

    viewPost(postId) {
      this.$router.push(`/post/${postId}`);
    },

    handleProfileImageError(e) {
      e.target.src = '/images/default-profile.png';
    }
  },
  created() {
    this.loadProfile();
  }
}
</script>

<style scoped>
.profile-container {
  max-width: 935px;
  margin: 0 auto;
  padding: 30px 20px;
}

.profile-header {
  display: flex;
  margin-bottom: 44px;
}

.profile-image {
  width: 150px;
  height: 150px;
  margin-right: 100px;
}

.profile-image img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.profile-info {
  flex: 1;
}

.profile-top {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.profile-top h2 {
  font-size: 28px;
  margin: 0;
}

.edit-button {
  background-color: #efefef;
  color: #262626;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-button:hover {
  background-color: #dbdbdb;
}

.profile-stats {
  display: flex;
  gap: 40px;
  margin-bottom: 20px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.count {
  font-weight: bold;
  font-size: 18px;
}

.profile-text {
  margin-bottom: 16px;
}

.visibility-info {
  color: #8e8e8e;
  font-size: 14px;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

.post-item {
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
}

.post-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-item:hover img {
  opacity: 0.9;
}
</style>
