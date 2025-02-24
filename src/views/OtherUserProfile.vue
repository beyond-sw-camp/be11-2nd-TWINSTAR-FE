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
          <div class="action-buttons">
            <button 
              @click="toggleFollow" 
              class="follow-button"
              :class="{ 'following': isFollowing }"
            >
              <i :class="isFollowing ? 'fas fa-user-check' : 'fas fa-user-plus'"></i>
              {{ isFollowing ? '팔로잉' : '팔로우' }}
            </button>
            <button @click="startChat" class="chat-button">
              <i class="fas fa-comment"></i> 채팅하기
            </button>
          </div>
        </div>
        <div class="profile-stats">
          <div class="stat">
            <span class="count">{{ profile.posts?.length || 0 }}</span>
            <span class="label">게시물</span>
          </div>
          <div class="stat">
            <span class="count">{{ profile.followerCount }}</span>
            <span class="label">팔로워</span>
          </div>
          <div class="stat">
            <span class="count">{{ profile.followingCount }}</span>
            <span class="label">팔로잉</span>
          </div>
        </div>
        <p class="profile-text">{{ profile.profileTxt }}</p>
      </div>
    </div>

    <div class="posts-grid">
      <div v-for="post in profile.posts" :key="post.id" class="post-item">
        <img 
          :src="post.imageUrl" 
          :alt="post.content"
          @error="handlePostImageError"
          @click="viewPost(post.id)"
        >
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'OtherUserProfile',
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
      },
      isFollowing: false
    }
  },
  methods: {
    async loadProfile() {
      try {
        const userId = this.$route.params.id;
        console.log('로딩할 유저 ID:', userId);
        
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('토큰이 없습니다.');
          return;
        }

        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/user/detail/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        console.log('프로필 응답:', response.data);
        
        if (response.data && response.data.data) {
          this.profile = response.data.data;
          // 게시물 이미지 URL 처리 수정
          if (this.profile.posts) {
            this.profile.posts = this.profile.posts.map(post => ({
              ...post,
              // 이미지 URL이 전체 URL이 아닌 경우 baseURL과 결합
              imageUrl: post.imageUrl?.startsWith('http') 
                ? post.imageUrl 
                : `${process.env.VUE_APP_API_BASE_URL}/images/${post.imageUrl}`
            }));
          }
          console.log('처리된 게시물:', this.profile.posts); // 디버깅용
          this.isFollowing = response.data.result.isFollowing || false;
        }
      } catch (error) {
        console.error('프로필 로딩 에러:', error.response || error);
        if (error.response?.status === 403) {
          alert('비공개 계정입니다.');
        } else if (error.response?.status === 404) {
          alert('사용자를 찾을 수 없습니다.');
        } else {
          alert('프로필을 불러오는데 실패했습니다.');
        }
      }
    },

    async toggleFollow() {
      try {
        const userId = this.profile.id;
        if (this.isFollowing) {
          await axios.post(`${process.env.VUE_APP_API_BASE_URL}/user/unfollow/${userId}`);
        } else {
          await axios.post(`${process.env.VUE_APP_API_BASE_URL}/user/follow/${userId}`);
        }
        this.isFollowing = !this.isFollowing;
        this.profile.followerCount += this.isFollowing ? 1 : -1;
      } catch (error) {
        console.error('팔로우 토글 실패:', error);
        alert('팔로우 상태 변경에 실패했습니다.');
      }
    },

    startChat() {
      this.$router.push(`/chat/${this.profile.id}`);
    },

    handleProfileImageError(e) {
      e.target.src = '/images/default-profile.png';
    },

    handlePostImageError(e) {
      e.target.src = '/images/default-post.png';
    },
    
    viewPost(postId) {
      this.$router.push(`/post/${postId}`);
    }
  },
  created() {
    this.loadProfile();
  },
  watch: {
    '$route.params.id': {
      handler(newId) {
        if (newId) {
          this.loadProfile();
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

.action-buttons {
  display: flex;
  gap: 10px;
}

.follow-button {
  background-color: #0095f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.follow-button.following {
  background-color: #efefef;
  color: #262626;
}

.follow-button:hover {
  background-color: #0081d6;
}

.follow-button.following:hover {
  background-color: #dbdbdb;
}

.chat-button {
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

.chat-button:hover {
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

.posts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

.post-item {
  aspect-ratio: 1;
  overflow: hidden;
}

.post-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
