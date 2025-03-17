<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ type === 'followers' ? '팔로워' : '팔로잉' }}</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="follow-list">
        <div v-for="user in users" :key="user.id" class="follow-item">
          <div class="user-info" @click="goToProfile(user.id)">
            <img 
              :src="user.profileImg || '/images/default-profile.png'" 
              @error="handleImageError"
              :alt="user.nickName" 
              class="user-avatar"
            >
            <span class="user-name">{{ user.nickName }}</span>
          </div>
          <button 
            v-if="user.isFollow === 'N' && user.id !== currentUserId" 
            @click="followUser(user.id)"
            class="follow-button"
          >
            팔로우
          </button>
        </div>
        
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

export default {
  name: 'FollowListModal',
  props: {
    type: {
      type: String,
      required: true,
      validator: value => ['followers', 'following'].includes(value)
    }
  },
  data() {
    return {
      users: [],
      loading: false,
      page: 0,
      hasMore: true,
      currentUserId: null
    }
  },
  methods: {
    async loadUsers() {
      if (this.loading || !this.hasMore) return;
      
      this.loading = true;
      try {
        const userId = this.$route.params.id;
        const endpoint = this.type === 'followers' 
          ? `following/${userId}`  // 팔로워 목록 조회 엔드포인트 변경
          : `follower/${userId}`;  // 팔로잉 목록 조회 엔드포인트 변경
          
        // 요청 URL 로깅 추가
        console.log(`Request URL: ${process.env.VUE_APP_API_BASE_URL}/follow/${endpoint}?page=${this.page}&size=20`);
          
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/follow/${endpoint}`,
          {
            params: {
              page: this.page,
              size: 20
            },
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        const newUsers = response.data.result.content;
        this.users.push(...newUsers);
        this.hasMore = !response.data.result.last;
        this.page++;
      } catch (error) {
        console.error('팔로우 목록 로딩 실패:', error);
      } finally {
        this.loading = false;
      }
    },
    handleImageError(e) {
      e.target.src = '/images/default-profile.png'
    },
    goToProfile(userId) {
      this.$router.push(`/profile/${userId}`);
      this.$emit('close');
    },
    async followUser(userId) {
      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/follow/toggle/${userId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.data.status_code === 200) {
          // 팔로우 성공 시 해당 유저의 isFollow 상태를 'Y'로 변경
          const user = this.users.find(u => u.id === userId);
          if (user) {
            user.isFollow = 'Y';
          }
          
          // 부모 컴포넌트의 프로필 정보 새로고침
          if (this.$parent.loadProfile) {
            await this.$parent.loadProfile();
          }
        }
      } catch (error) {
        console.error('팔로우 실패:', error);
        alert('팔로우에 실패했습니다.');
      }
    }
  },
  mounted() {
    // 토큰에서 현재 사용자 ID 가져오기
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      this.currentUserId = parseInt(decoded.sub);
    }
    
    this.loadUsers();
    
    // 무한 스크롤
    const modalContent = this.$el.querySelector('.follow-list');
    modalContent.addEventListener('scroll', () => {
      if (modalContent.scrollHeight - modalContent.scrollTop <= modalContent.clientHeight + 100) {
        this.loadUsers();
      }
    });
  }
}
</script>

<style scoped>
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
  border-radius: 12px;
  width: 400px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  padding: 16px;
  border-bottom: 1px solid #dbdbdb;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
}

.follow-list {
  overflow-y: auto;
  max-height: calc(80vh - 54px);
}

.follow-item {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #efefef;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-weight: 600;
  color: #262626;
}

.follow-button {
  background: #0095f6;
  color: white;
  border: none;
  padding: 7px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}

.loading {
  padding: 20px;
  text-align: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #dbdbdb;
  border-top-color: #0095f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style> 