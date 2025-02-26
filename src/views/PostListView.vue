<template>
  <div class="post-list">
    <!-- 헤더 영역 -->
    <header class="header">
      <h1>Instagram</h1>
    </header>

    <!-- 게시물 리스트 -->
    <div class="posts-container">
      <div v-for="post in posts" :key="post.postId" class="post-card">
        <!-- 게시물 헤더 -->
        <div class="post-header">
          <div class="user-info">
            <img :src="post.profileImage" :alt="post.nickName" class="profile-image">
            <span class="nickname">{{ post.nickName }}</span>
          </div>
          <div class="more-options" v-if="post.userId === currentUserId">
            <i class="fas fa-ellipsis-h"></i>
          </div>
        </div>

        <!-- 게시물 이미지 -->
        <div class="post-images" v-if="post.imageList && post.imageList.length">
          <img :src="post.imageList[0]" alt="게시물 이미지">
        </div>

        <!-- 게시물 액션 버튼 -->
        <div class="post-actions">
          <div class="left-actions">
            <i class="far fa-heart"></i>
            <i class="far fa-comment"></i>
            <i class="far fa-paper-plane"></i>
          </div>
          <i class="far fa-bookmark"></i>
        </div>

        <!-- 좋아요 수 -->
        <div class="likes-count">
          좋아요 {{ post.likeCount }}개
        </div>

        <!-- 게시물 내용 -->
        <div class="post-content">
          <span class="nickname">{{ post.nickName }}</span>
          <span class="content">{{ post.content }}</span>
        </div>

        <!-- 댓글 수 -->
        <div class="comments-count" v-if="post.commentCount > 0">
          댓글 {{ post.commentCount }}개 모두 보기
        </div>

        <!-- 작성 시간 -->
        <div class="created-time">
          {{ formatDate(post.createdTime) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { ref, onMounted } from 'vue'

export default {
  name: 'PostListView',
  setup() {
    const posts = ref([])
    const currentUserId = ref(null) // 현재 로그인한 사용자 ID
    
    const fetchPosts = async () => {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/post/list`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
          }
        )
        console.log(response.data.result.content)
        posts.value = response.data.result.content
      } catch (error) {
        console.error('게시물 불러오기 실패:', error)
      }
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      const now = new Date()
      const diff = now - date

      // 1일 이내
      if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000))
        if (hours < 1) {
          const minutes = Math.floor(diff / (60 * 1000))
          return `${minutes}분 전`
        }
        return `${hours}시간 전`
      }
      
      // 1일 이상
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
    }

    onMounted(() => {
      fetchPosts()
    })

    return {
      posts,
      currentUserId,
      formatDate
    }
  }
}
</script>

<style scoped>
.post-list {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px 0;
}

.header {
  padding: 15px 0;
  border-bottom: 1px solid #dbdbdb;
  text-align: center;
}

.header h1 {
  font-family: 'Instagram Sans Script', cursive;
  margin: 0;
}

.post-card {
  background: white;
  border: 1px solid #dbdbdb;
  border-radius: 3px;
  margin-bottom: 20px;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px;
}

.user-info {
  display: flex;
  align-items: center;
}

.profile-image {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 10px;
}

.nickname {
  font-weight: 600;
}

.post-images img {
  width: 100%;
  height: auto;
}

.post-actions {
  display: flex;
  justify-content: space-between;
  padding: 12px;
}

.left-actions i {
  margin-right: 16px;
}

.post-content, .likes-count, .comments-count, .created-time {
  padding: 0 12px;
  margin-bottom: 8px;
}

.created-time {
  color: #8e8e8e;
  font-size: 0.9em;
}

i {
  font-size: 24px;
  cursor: pointer;
}

/* 반응형 디자인 */
@media (max-width: 600px) {
  .post-list {
    padding: 0;
  }
  
  .post-card {
    border-left: none;
    border-right: none;
  }
}
</style>
