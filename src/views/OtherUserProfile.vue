<template>
  <div class="profile-container">
    <div class="profile-header">
      <div class="profile-image">
        <img :src="profile.profileImg || '/default-profile.png'" alt="프로필 이미지">
      </div>
      <div class="profile-info">
        <div class="profile-top">
          <h2>{{ profile.nickName }}</h2>
          <button @click="startChat" class="chat-button">
            <i class="fas fa-comment"></i> 채팅하기
          </button>
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
        <img :src="post.imageUrl" :alt="post.content">
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'UserProfile',
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
        const userId = this.$route.params.userId;
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/user/detail/${userId}`
        );
        
        if (response.data && response.data.result) {
          this.profile = response.data.result;
        }
      } catch (error) {
        if (error.response?.data?.message) {
          alert(error.response.data.message);
        } else {
          alert('프로필을 불러오는데 실패했습니다.');
        }
        this.$router.push('/');
      }
    },
    
    startChat() {
      // 채팅 기능 구현
      this.$router.push(`/chat/${this.profile.id}`);
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

.chat-button {
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

.chat-button:hover {
  background-color: #0081d6;
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
