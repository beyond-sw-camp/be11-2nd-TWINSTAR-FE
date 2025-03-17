<template>
  <div class="post-list">
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
            <button v-if="post.isFollow === 'N' || post.isAnimating" 
                    class="follow-btn" 
                    @click="followUser(post.userId)"
                    :disabled="post.followLoading || post.isAnimating">
              <span v-if="post.followLoading" class="loading-spinner"></span>
              <span v-else-if="post.showCheck" class="check-icon">✓</span>
              <span v-else>팔로우</span>
            </button>
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
        <div class="likes-count" @click="showLikeList(post.postId)">
          <strong style="cursor: pointer;">좋아요 {{ post.likeCount }}개</strong>
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
              <button v-if="post.content.length > 30 && !post.showFullContent" 
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

    <!-- 좋아요 목록 모달 -->
    <div v-if="showLikesModal" class="likes-modal-overlay" @click.self="closeLikesModal">
      <div class="likes-modal">
        <div class="likes-modal-header">
          <h2>좋아요</h2>
          <button class="close-modal-btn" @click="closeLikesModal">×</button>
        </div>
        
        <div class="likes-search">
          <i class="fas fa-search search-icon"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="검색"
            @input="filterLikes"
          >
        </div>

        <div class="likes-list">
          <div v-for="like in filteredLikes" 
               :key="like.id" 
               class="like-item">
            <div class="like-user-info">
              <img 
                :src="like.profileImg || '/images/default-profile.png'" 
                @error="handleImageError" 
                :alt="like.nickName"
                class="like-profile-img"
                @click="goToUserProfile(like.id)"
              >
              <span class="like-nickname" @click="goToUserProfile(like.id)">
                {{ like.nickName }}
              </span>
            </div>
            <button 
              v-if="like.isFollow === 'N'" 
              class="follow-button"
              @click="followLikeUser(like.id)"
              :disabled="like.followLoading"
            >
              <span v-if="like.followLoading" class="loading-spinner"></span>
              <span v-else>팔로우</span>
            </button>
          </div>
          <div v-if="likesLoading" class="loading-more">
            <div class="loading-spinner"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'PostListView',
  setup() {
    const posts = ref([])
    const currentUserId = ref(null)
    const page = ref(0)
    const loading = ref(false)
    const hasMore = ref(true)
    const showLikesModal = ref(false)
    const likes = ref([])
    const filteredLikes = ref([])
    const searchQuery = ref('')
    const likesPage = ref(0)
    const hasMoreLikes = ref(true)
    const likesLoading = ref(false)

    const fetchPosts = async () => {
      if (loading.value || !hasMore.value) return
      
      loading.value = true
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/post/list`,
          {
            params: {
              page: page.value,
              size: 5
            },
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
          }
        )
        
        const newPosts = response.data.result.content.map(post => ({
          ...post,
          currentSlide: 0,
          showFullContent: false,
          newComment: '',
          hashTag: post.hashTag.map(tag => tag.replace(/[[\]"\\s]/g, '')).filter(tag => tag !== ''),
          isLike: post.isLike === "Y",
          followLoading: false,
          showCheck: false,
          isAnimating: false
        }))
        
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

    const handleScroll = () => {
      const scrollHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      const scrollTop = Math.max(
        document.documentElement.scrollTop,
        document.body.scrollTop
      );
      const clientHeight = document.documentElement.clientHeight;

      if (scrollHeight - scrollTop <= clientHeight + 100) {
        fetchPosts();
      }
    };

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
        console.log(response.data)
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

    const showLikeList = async (postId) => {
      showLikesModal.value = true
      likes.value = []
      likesPage.value = 0
      hasMoreLikes.value = true
      await fetchLikes(postId)
    }

    const fetchLikes = async (postId) => {
      if (likesLoading.value || !hasMoreLikes.value) return
      
      likesLoading.value = true
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/post/like/list/${postId}`,
          {
            params: {
              page: likesPage.value,
              size: 10
            },
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
          }
        )

        const newLikes = response.data.result.content.map(like => ({
          ...like,
          followLoading: false
        }))
        
        likes.value = [...likes.value, ...newLikes]
        filterLikes()
        
        hasMoreLikes.value = newLikes.length === 10
        likesPage.value++
      } catch (error) {
        console.error('좋아요 목록 로드 실패:', error)
      } finally {
        likesLoading.value = false
      }
    }

    const filterLikes = () => {
      if (!searchQuery.value) {
        filteredLikes.value = likes.value
        return
      }
      
      filteredLikes.value = likes.value.filter(like =>
        like.nickName.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    }

    const closeLikesModal = () => {
      showLikesModal.value = false
      searchQuery.value = ''
      likes.value = []
    }

    const followUser = async (userId) => {
      const post = posts.value.find(p => p.userId === userId)
      if (!post || post.followLoading || post.isAnimating) return
      
      post.followLoading = true
      post.isAnimating = true
      const startTime = Date.now()
      
      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/follow/toggle/${userId}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
          }
        )
        
        if (response.data.status_code === 200) {
          // 최소 1.5초 대기
          const elapsedTime = Date.now() - startTime
          if (elapsedTime < 1500) {
            await new Promise(resolve => setTimeout(resolve, 1500 - elapsedTime))
          }
          
          post.followLoading = false
          post.showCheck = true
          
          // 체크 아이콘 0.8초 표시 후 버튼 제거
          await new Promise(resolve => setTimeout(resolve, 800))
          post.showCheck = false
          post.isFollow = 'Y'
          await new Promise(resolve => setTimeout(resolve, 200))
          post.isAnimating = false
        }
      } catch (error) {
        console.error('팔로우 실패:', error)
        post.followLoading = false
        post.isAnimating = false
      }
    }

    const followLikeUser = async (userId) => {
      const like = likes.value.find(l => l.id === userId)
      if (!like || like.followLoading) return
      
      like.followLoading = true
      
      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/follow/toggle/${userId}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
          }
        )
        
        if (response.data.status_code === 200) {
          like.isFollow = 'Y'
          like.followLoading = false
          
          // 게시물 목록에서도 해당 유저의 팔로우 상태 업데이트
          const relatedPost = posts.value.find(p => p.userId === userId)
          if (relatedPost) {
            relatedPost.isFollow = 'Y'
          }
        }
      } catch (error) {
        console.error('팔로우 실패:', error)
        like.followLoading = false
      }
    }

    onMounted(() => {
      fetchPosts()
      window.addEventListener('scroll', handleScroll)
    })

    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll)
    })

    return {
      posts,
      currentUserId,
      formatDate,
      loading,
      showMore,
      toggleLike,
      addComment,
      setSlide,
      prevSlide,
      nextSlide,
      goToUserProfile,
      goToPostDetail,
      showLikesModal,
      filteredLikes,
      searchQuery,
      likesLoading,
      showLikeList,
      closeLikesModal,
      followUser,
      followLikeUser
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
  padding: 2px;
}

.profile-button {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  margin-right: 8px;
}

.profile-image {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 8px;
  object-fit: cover;
}

.nickname {
  font-weight: 600;
}

.created-time {
  color: #8e8e8e;
  font-size: 14px;
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

.post-content, .likes-count, .comments-count{
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
  display: block;
  white-space: pre-wrap;
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
  color: #262626;
  transition: all 0.3s ease;
}

.action-button i.far.fa-heart {
  color: #262626;
}

.action-button i.fas.fa-heart.liked {
  color: #ed4956;
  transform: scale(1.2);
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

.likes-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.likes-modal {
  background: white;
  border-radius: 12px;
  width: 400px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.likes-modal-header {
  padding: 16px;
  border-bottom: 1px solid #dbdbdb;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.likes-modal-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-modal-btn {
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #262626;
}

.likes-search {
  padding: 8px 16px;
  border-bottom: 1px solid #dbdbdb;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  color: #8e8e8e;
}

.likes-search input {
  width: 100%;
  padding: 8px 8px 8px 36px;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  font-size: 14px;
}

.likes-list {
  overflow-y: auto;
  padding: 8px 0;
}

.like-item {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.like-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.like-profile-img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.like-nickname {
  font-weight: 600;
  color: #262626;
}

.follow-btn {
  background: transparent;
  color: #0095f6;
  border: none;
  padding: 5px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 70px;
  margin-left: auto;
}

.follow-btn:hover {
  opacity: 0.7;
}

.follow-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #0095f6;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.check-icon {
  display: inline-block;
  color: #0095f6;
  font-size: 14px;
  animation: popIn 0.3s ease;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes popIn {
  0% { transform: scale(0); }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); }
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
  transition: all 1.0s ease;
}

.follow-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
