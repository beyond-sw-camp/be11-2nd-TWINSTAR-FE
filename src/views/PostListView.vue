<template>
  <div class="post-list" @scroll="handleScroll">
    <!-- 게시물 리스트 -->
    <div class="posts-container">
      <div v-for="post in posts" :key="post.postId" class="post-card">
        <!-- 게시물 헤더 -->
        <div class="post-header">
          <div class="user-info">
            <button class="profile-button" @click="goToUserProfile(post.userId)">
              <img :src="post.profileImage" :alt="post.nickName" class="profile-image">
              <span class="nickname">{{ post.nickName }}</span>
            </button>
            <span class="created-time">{{ formatDate(post.createdTime) }}</span>
          </div>
          <div class="header-right">
            <div class="more-options" v-if="post.userId === currentUserId">
              <i class="fas fa-ellipsis-h"></i>
            </div>
          </div>
        </div>

        <!-- 게시물 이미지 -->
        <div class="post-images" v-if="post.imageList && post.imageList.length">
          <div class="slider-container">
            <div class="slider" :style="{ transform: `translateX(-${post.currentSlide * 100}%)` }">
              <img v-for="(image, index) in post.imageList" 
                   :key="index" 
                   :src="image" 
                   alt="게시물 이미지">
            </div>
            <div class="slider-dots" v-if="post.imageList.length > 1">
              <span v-for="(_, index) in post.imageList" 
                    :key="index" 
                    :class="['dot', { active: index === post.currentSlide }]"
                    @click="setSlide(post, index)"></span>
            </div>
            <button v-if="post.imageList.length > 1" 
                    class="slider-button prev" 
                    @click="prevSlide(post)">&lt;</button>
            <button v-if="post.imageList.length > 1" 
                    class="slider-button next" 
                    @click="nextSlide(post)">&gt;</button>
          </div>
        </div>

        <!-- 게시물 액션 버튼 -->
        <div class="post-actions">
          <div class="left-actions">
            <button class="action-button" @click="toggleLike(post)">
              <i :class="[post.isLike ? 'fas' : 'far', 'fa-heart', { 'liked': post.isLike }]"></i>
            </button>
            <button class="action-button" @click="goToPostDetail(post.postId)">
              <i class="far fa-comment"></i>
            </button>
          </div>
        </div>

        <!-- 좋아요 수 -->
        <div class="likes-count">
          <strong>좋아요 {{ post.likeCount }}개</strong>
        </div>

        <!-- 게시물 내용 -->
        <div class="post-content">
          <div class="content-wrapper">
            <button class="profile-button" @click="goToUserProfile(post.userId)">
              <span class="nickname">{{ post.nickName }}</span>
            </button>
            <div class="content-line">
              <span class="content" :class="{ 'truncated': !post.showFullContent }">
                {{ post.content }}
              </span>
              <button v-if="post.content.length > 100 && !post.showFullContent" 
                      class="more-button"
                      @click="showMore(post)">
                ...더보기
              </button>
            </div>
          </div>
        </div>

        <!-- 해시태그 추가 -->
        <div class="hashtags" v-if="post.hashTag && post.hashTag.length">
          <span v-for="(tag, index) in post.hashTag" 
                :key="index" 
                class="hashtag">
            #{{ tag }}
          </span>
        </div>

        <!-- 댓글 수 -->
        <div class="comments-section">
          <button class="comments-count-button" @click="goToPostDetail(post.postId)">
            <div v-if="post.commentCount > 0">
              댓글 {{ post.commentCount }}개 모두 보기
            </div>
            <div v-else>
              댓글 0개
            </div>
          </button>
          <div class="comment-input">
            <input type="text" 
                   :placeholder="'댓글 달기...'" 
                   v-model="post.newComment"
                   @keyup.enter="addComment(post)">
            <button :disabled="!post.newComment" 
                    @click="addComment(post)"
                    :class="{ active: post.newComment }">
              게시
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="loading" class="loading">로딩 중...</div>
  </div>
</template>

<script>
import axios from 'axios'
import { ref, onMounted } from 'vue'

export default {
  name: 'PostListView',
  setup() {
    const posts = ref([])
    const currentUserId = ref(null)
    const page = ref(0)
    const loading = ref(false)
    const hasMore = ref(true)

    const fetchPosts = async () => {
      if (loading.value || !hasMore.value) return
      
      loading.value = true
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/post/list`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
          }
        )
        // 응답 데이터 확인을 위한 콘솔 출력
        console.log('서버 응답 데이터:', response.data.result.content)
        
        const newPosts = response.data.result.content.map(post => {
          // 해시태그 처리
          let cleanedHashTags = post.hashTag.map(tag => {
            return tag.replace(/[[\]"\\s]/g, '');
          }).filter(tag => tag !== '');

          return {
            ...post,
            currentSlide: 0,
            showFullContent: false,
            newComment: '',
            hashTag: cleanedHashTags,
            isLike: post.isLike === "Y"  // "Y"일 때만 true, 나머지는 false
          }
        })
        
        if (page.value === 0) {
          posts.value = newPosts
        } else {
          posts.value = [...posts.value, ...newPosts]
        }
        
        hasMore.value = newPosts.length === 5
        page.value++
      } catch (error) {
        console.error('게시물 불러오기 실패:', error)
      } finally {
        loading.value = false
      }
    }

    const formatDate = (dateArray) => {
      if (!Array.isArray(dateArray)) return ''
      
      const date = new Date(dateArray[0], dateArray[1] - 1, dateArray[2], 
                           dateArray[3], dateArray[4], dateArray[5])
      const now = new Date()
      const diff = now - date

      const minutes = Math.floor(diff / (1000 * 60))
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const weeks = Math.floor(days / 7)

      if (minutes < 1) return '방금 전' 
      if (minutes < 60) return `${minutes}분 전`
      if (hours < 24) return `${hours}시간 전`
      if (days < 7) return `${days}일 전`
      return `${weeks}주 전`
    }

    const handleScroll = (e) => {
      const element = e.target
      if (element.scrollHeight - element.scrollTop <= element.clientHeight + 100) {
        fetchPosts()
      }
    }

    const showMore = (post) => {
      post.showFullContent = true
    }

    const toggleLike = async (post) => {
      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/post/like/${post.postId}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
          }
        )
        if (response.data.status_code === 200) {
          post.isLike = !post.isLike
          post.likeCount = Number(post.likeCount) + (post.isLike ? 1 : -1)
        }
      } catch (error) {
        console.error('좋아요 토글 실패:', error)
      }
    }

    const addComment = async (post) => {
      if (!post.newComment.trim()) return

      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/comment/create`,
          {
            postId: post.postId,
            content: post.newComment
          },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
          }
        )
        console.log('댓글 작성 응답:', response.data)

        if (response.data.status_code === 200) {
          // 댓글 작성 성공 시 댓글 수 증가 및 입력창 초기화
          post.commentCount += 1
          post.newComment = ''
        }
      } catch (error) {
        console.error('댓글 작성 실패:', error)
      }
    }

    const setSlide = (post, index) => {
      post.currentSlide = index
    }

    const prevSlide = (post) => {
      post.currentSlide = post.currentSlide > 0 ? post.currentSlide - 1 : post.imageList.length - 1
    }

    const nextSlide = (post) => {
      post.currentSlide = post.currentSlide < post.imageList.length - 1 ? post.currentSlide + 1 : 0
    }

    const goToUserProfile = (userId) => {
      window.location.href = `profile/${userId}`
    }

    const goToPostDetail = (postId) => {
      window.location.href = `/post/detail/${postId}`
    }

    onMounted(() => {
      fetchPosts()
    })

    return {
      posts,
      currentUserId,
      formatDate,
      handleScroll,
      loading,
      showMore,
      toggleLike,
      addComment,
      setSlide,
      prevSlide,
      nextSlide,
      goToUserProfile,
      goToPostDetail
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

.profile-button {
  display: inline-flex;
  align-items: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  margin-right: 5px;
}

.profile-button:hover {
  opacity: 0.8;
}

.profile-image {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.nickname {
  font-weight: 600;
}

.created-time {
  color: #8e8e8e;
  font-size: 0.8em;
  margin-top: 10px;
}

.post-images {
  width: 100%;
  height: 600px;
  position: relative;
  background-color: #fff; /* 검은색에서 흰색으로 변경 */
}

.slider-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.slider {
  display: flex;
  height: 100%;
  transition: transform 0.3s ease;
}

.slider img {
  width: 600px;
  height: 600px;
  object-fit: contain;
  flex-shrink: 0;
  background-color: #fff; /* 검은색에서 흰색으로 변경 */
}

.post-actions {
  padding: 12px;
}

.left-actions {
  display: flex;
  gap: 8px;  /* 버튼 사이의 간격 조정 */
}

.post-content, .likes-count, .comments-count, .created-time {
  padding: 0 12px;
  margin-bottom: 8px;
}

.created-time {
  color: #8e8e8e;
  font-size: 0.8em;
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

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.slider-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
}

.prev { left: 10px; }
.next { right: 10px; }

.slider-dots {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
}

.dot.active {
  background: #0095f6;
}

.likes-count {
  text-align: left;
  padding: 0 12px;
  margin-bottom: 8px;
}

.post-content {
  text-align: left;
  padding: 0 12px;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
}

.content-line {
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.content {
  word-break: break-all;
}

.content.truncated {
  display: inline;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 450px; /* 적절한 값으로 조정하세요 */
}

.more-button {
  background: none;
  border: none;
  color: #8e8e8e;
  cursor: pointer;
  padding: 0;
  font-size: inherit;
}

.comment-input {
  display: flex;
  padding: 12px;
  border-top: 1px solid #dbdbdb;
}

.comment-input input {
  flex: 1;
  border: none;
  outline: none;
  padding: 8px;
  color: #262626;
}

.comment-input input::placeholder {
  color: #8e8e8e;
}

.comment-input button {
  border: none;
  background: none;
  color: #0095f6;
  font-weight: 600;
  opacity: 0.3;
  cursor: not-allowed;
}

.comment-input button.active {
  opacity: 1;
  cursor: pointer;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #8e8e8e;
}

.liked {
  color: #ed4956;
}

.hashtags {
  padding: 0 12px;
  margin-bottom: 8px;
  text-align: left;
}

.hashtag {
  color: #0095f6;
  margin-right: 8px;
  cursor: pointer;
}

.hashtag:hover {
  text-decoration: underline;
}

.action-button {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
}

.action-button i {
  font-size: 1.5rem;
  color: #262626;  /* 기본 하트 색상 (검은색) */
}

.action-button i.far.fa-heart {
  color: #262626;  /* 빈 하트 색상 */
}

.action-button i.fas.fa-heart.liked {
  color: #ed4956;  /* 채워진 하트 색상 (빨간색) */
}

.action-button:hover {
  opacity: 0.7;
}

.comments-section {
  text-align: left;
}

.comments-count-button {
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 0 12px;
  margin-bottom: 8px;
  color: #8e8e8e;
  cursor: pointer;
}

.comments-count-button:hover {
  opacity: 0.7;
}

.comment-input {
  display: flex;
  padding: 12px;
  border-top: 1px solid #dbdbdb;
}

.comment-input input {
  flex: 1;
  border: none;
  outline: none;
  padding: 8px;
  color: #262626;
}

.comment-input input::placeholder {
  color: #8e8e8e;
}
</style>
