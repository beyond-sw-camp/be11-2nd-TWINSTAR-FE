<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content" v-if="post">
      <button class="close-btn" @click="closeModal">×</button>
      <div class="post-container">
        <!-- 이미지 슬라이더 -->
        <div class="image-slider">
          <button class="slider-btn prev" @click="prevImage" v-if="currentImageIndex > 0">❮</button>
          <button class="slider-btn next" @click="nextImage" v-if="currentImageIndex < post.imageList.length - 1">❯</button>
          <img :src="post.imageList[currentImageIndex]" alt="게시물 이미지" class="slider-image">
          <div class="image-dots" v-if="post.imageList.length > 1">
            <span 
              v-for="(_, index) in post.imageList" 
              :key="index"
              :class="['dot', { active: currentImageIndex === index }]"
              @click="currentImageIndex = index"
            ></span>
          </div>
        </div>

        <!-- 게시물 정보 -->
        <div class="post-info">
          <!-- 헤더 -->
          <div class="post-header">
            <div class="header-user-info">
              <img 
                :src="post.profileImage || '/images/default-profile.png'" 
                @error="handleImageError"
                alt="프로필" 
                class="header-profile-image"
                @click="goToUserProfile(post.userId)"
                style="cursor: pointer;"
              >
              <div class="header-user-text">
                <span class="header-nickname" @click="goToUserProfile(post.userId)" style="cursor: pointer;">
                  {{ post.nickName }}
                </span>
                <button class="follow-btn" @click="followUser(post.userId)">팔로우</button>
              </div>
            </div>
            <button v-if="post.isUpdate === 'Y'" class="more-btn">···</button>
          </div>

          <!-- 내용 -->
          <div class="post-content">
            <div class="content-user-info">
              <img 
                :src="post.profileImage || '/images/default-profile.png'" 
                @error="handleImageError"
                alt="프로필" 
                class="content-profile-image"
                @click="goToUserProfile(post.userId)"
                style="cursor: pointer;"
              >
              <div class="content-text">
                <div class="content-top">
                  <strong class="content-nickname" @click="goToUserProfile(post.userId)" style="cursor: pointer;">
                    {{ post.nickName }}
                  </strong>
                  <div class="content-body">{{ post.content }}</div>
                </div>
                <div class="hashtags" v-if="post.hashTag && post.hashTag.length">
                  <span v-for="(tag, index) in post.hashTag" 
                        :key="index" 
                        class="hashtag">
                    #{{ tag }}
                  </span>
                </div>
                <div class="content-bottom">
                  <span class="created-time">{{ formatDate(post.createdTime) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 댓글 목록 -->
          <div class="comments-section">
            <div v-for="comment in getMainComments()" :key="comment.id" class="comment">
              <div class="comment-header">
                <div class="comment-user-info">
                  <img 
                    :src="comment.profileImage || '/images/default-profile.png'" 
                    @error="handleImageError"
                    alt="프로필" 
                    class="comment-profile-image"
                    @click="goToUserProfile(comment.userId)"
                    style="cursor: pointer;"
                  >
                  <div class="comment-text">
                    <div class="comment-top">
                      <strong class="nickname" @click="goToUserProfile(comment.userId)" style="cursor: pointer;">
                        {{ comment.nickName }}
                      </strong>
                      <span :class="['comment-content', { 'deleted': comment.isDelete === 'Y' }]">
                        {{ comment.isDelete === 'Y' ? '삭제된 댓글입니다.' : comment.content }}
                      </span>
                    </div>
                    <div class="comment-bottom">
                      <span class="created-time">{{ formatDate(comment.createdTime) }}</span>
                      <span class="like-count" v-if="comment.likeCount > 0">좋아요 {{ comment.likeCount }}개</span>
                      <button v-if="!comment.parentId" class="reply-button" @click="toggleReplyInput(comment)">답글 달기</button>
                      <button v-if="isCommentAuthor(comment)" 
                              class="delete-button" 
                              @click="deleteComment(comment.id)">
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
                <button class="comment-like-btn" @click="toggleCommentLike(comment)">
                  <i :class="[comment.isLike === 'Y' ? 'fas' : 'far', 'fa-heart', { 'liked': comment.isLike === 'Y' }]"></i>
                </button>
              </div>

              <!-- 답글 보기 버튼 -->
              <div v-if="getReplyCount(comment.id) > 0" class="view-replies">
                <button class="view-replies-btn" @click="toggleReplies(comment)">
                  <span class="reply-line"></span>
                  답글 {{ getReplyCount(comment.id) }}개 {{ comment.showReplies ? '숨기기' : '보기' }}
                </button>
              </div>

              <!-- 답글 목록 -->
              <div v-if="comment.showReplies" class="replies">
                <div v-for="reply in getReplies(comment.id)" :key="reply.id" class="reply">
                  <div class="comment-header">
                    <div class="comment-user-info">
                      <img 
                        :src="reply.profileImage || '/images/default-profile.png'" 
                        @error="handleImageError"
                        alt="프로필" 
                        class="comment-profile-image"
                        @click="goToUserProfile(reply.userId)"
                        style="cursor: pointer;"
                      >
                      <div class="comment-text">
                        <div class="comment-top">
                          <strong class="nickname" @click="goToUserProfile(reply.userId)" style="cursor: pointer;">
                            {{ reply.nickName }}
                          </strong>
                          <span :class="['comment-content', { 'deleted': reply.isDelete === 'Y' }]">
                            {{ reply.isDelete === 'Y' ? '삭제된 댓글입니다.' : reply.content }}
                          </span>
                        </div>
                        <div class="comment-bottom">
                          <span class="created-time">{{ formatDate(reply.createdTime) }}</span>
                          <span class="like-count" v-if="reply.likeCount > 0">좋아요 {{ reply.likeCount }}개</span>
                          <button v-if="isCommentAuthor(reply)" 
                                  class="delete-button" 
                                  @click="deleteComment(reply.id)">
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                    <button class="comment-like-btn" @click="toggleCommentLike(reply)">
                      <i :class="[reply.isLike === 'Y' ? 'fas' : 'far', 'fa-heart', { 'liked': reply.isLike === 'Y' }]"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- 답글 입력 영역 -->
              <div class="reply-input" v-if="comment.showReplyInput">
                <input type="text" 
                       placeholder="답글 달기..." 
                       v-model="comment.replyContent"
                       @keyup.enter="addReply(comment)">
                <button :disabled="!comment.replyContent" 
                        @click="addReply(comment)"
                        :class="{ active: comment.replyContent }">
                  게시
                </button>
              </div>
            </div>
          </div>

          <!-- 게시물 액션 버튼 -->
          <div class="post-actions">
            <div class="left-actions">
              <button class="action-button" @click="toggleLike">
                <i :class="[post.isLike === 'Y' ? 'fas' : 'far', 'fa-heart', { 'liked': post.isLike === 'Y' }]"></i>
              </button>
              <button class="action-button" @click="focusCommentInput">
                <i class="far fa-comment"></i>
              </button>
            </div>
          </div>

          <!-- 좋아요 수 -->
          <div class="likes-count">
            <strong>좋아요 {{ post.postLikeCount }}개</strong>
          </div>

          <!-- 댓글 입력 -->
          <div class="comment-input">
            <input type="text" 
                   placeholder="댓글 달기..." 
                   v-model="newComment"
                   @keyup.enter="addComment"
                   ref="commentInput">
            <button :disabled="!newComment" 
                    @click="addComment"
                    :class="{ active: newComment }">
              게시
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="loading">로딩중...</div>
  </div>
</template>

<script>
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

export default {
  name: 'PostDetail',
  data() {
    return {
      post: null,
      currentImageIndex: 0,
      newComment: ''
    }
  },
  async created() {
    const postId = this.$route.params.postId
    try {
      const response = await axios.get(
        `${process.env.VUE_APP_API_BASE_URL}/post/detail/${postId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      console.log(response.data)
      
      // PostListView.vue와 동일한 방식으로 해시태그 처리
      let cleanedHashTags = response.data.result.hashTag.map(tag => {
        return tag.replace(/[[\]"\\s]/g, '');
      }).filter(tag => tag !== '');
      
      response.data.result.hashTag = cleanedHashTags;
      this.post = response.data.result
    } catch (error) {
      console.error('게시물 로드 실패:', error)
    }
  },
  methods: {
    closeModal() {
      this.$router.push('/') // 또는 이전 페이지로 이동
    },
    toggleLike() {
      // 좋아요 토글 로직 구현
    },
    prevImage() {
      if (this.currentImageIndex > 0) {
        this.currentImageIndex--
      }
    },
    nextImage() {
      if (this.currentImageIndex < this.post.imageList.length - 1) {
        this.currentImageIndex++
      }
    },
    handleImageError(e) {
      e.target.src = '/images/default-profile.png'
    },
    formatDate(dateArray) {
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
    },
    async toggleCommentLike(comment) {
      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/comment/like/${comment.id}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
          }
        )
        if (response.data.status_code === 200) {
          comment.isLike = comment.isLike === 'Y' ? 'N' : 'Y'
          comment.likeCount = Number(comment.likeCount) + (comment.isLike === 'Y' ? 1 : -1)
        }
      } catch (error) {
        console.error('댓글 좋아요 토글 실패:', error)
      }
    },
    async addComment() {
      if (!this.newComment) return
      
      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/comment/create`,
          { content: this.newComment, postId: this.post.postId },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        )
        if (response.data.status_code === 200) {
          // 댓글 추가 후 댓글 목록 새로고침
          this.newComment = ''
          // 필요한 경우 댓글 목록 새로고침 로직 추가
        }
      } catch (error) {
        console.error('댓글 작성 실패:', error)
      }
    },
    focusCommentInput() {
      this.$refs.commentInput.focus();
    },
    toggleReplyInput(comment) {
      if (!comment.showReplyInput) {
        comment.showReplyInput = true;
        comment.replyContent = '';
      } else {
        comment.showReplyInput = false;
      }
    },
    async addReply(comment) {
      if (!comment.replyContent) return;
      
      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/comment/reply`,
          {
            parentId: comment.id,
            content: comment.replyContent
          },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        console.log(response.data)
        
        if (response.data.status_code === 200) {
          comment.replyContent = '';
          comment.showReplyInput = false;
          // 필요한 경우 댓글 목록 새로고침 로직 추가
        }
      } catch (error) {
        console.error('답글 작성 실패:', error);
      }
    },
    getMainComments() {
      return this.post.commentList.filter(comment => !comment.parentId);
    },
    getReplyCount(commentId) {
      return this.post.commentList.filter(comment => comment.parentId === commentId).length;
    },
    getReplies(commentId) {
      return this.post.commentList.filter(comment => comment.parentId === commentId);
    },
    toggleReplies(comment) {
      comment.showReplies = !comment.showReplies;
    },
    goToUserProfile(userId) {
      window.location.href = `/profile/${userId}`;
    },
    isCommentAuthor(comment) {
      let currentUserId = null;
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode(token);
        currentUserId = Number(decoded.sub);
      }
      return currentUserId && currentUserId === comment.userId;
    },
    async deleteComment(commentId) {
      if (!confirm('댓글을 삭제하시겠습니까?')) return;

      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/comment/delete/${commentId}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.data.status_code === 200) {
          // 댓글 목록 새로고침
          this.fetchPostDetail();
        }
      } catch (error) {
        console.error('댓글 삭제 실패:', error);
      }
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  background: white;
  width: 70%;
  max-width: 1035px;
  height: 90vh;
  border-radius: 4px;
  overflow: hidden;
}

.post-container {
  display: flex;
  height: 100%;
}

.image-slider {
  width: 60%;
  background: black;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slider-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.close-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  color: #fff;
  font-size: 36px;  /* 1.5배 더 크게 */
  cursor: pointer;
  z-index: 1001;
  width: 60px;  /* 1.5배 더 크게 */
  height: 60px;  /* 1.5배 더 크게 */
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.post-info {
  width: 40%;
  display: flex;
  flex-direction: column;
  background: white;
  height: 100%;
}

.post-header {
  padding: 14px 16px;
  border-bottom: 1px solid #dbdbdb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-profile-image {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.header-user-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-nickname {
  font-weight: 600;
  color: #262626;
  font-size: 14px;
}

.follow-btn {
  background: none;
  border: none;
  color: #0095f6;
  font-weight: 600;
  font-size: 14px;
  padding: 0;
  cursor: pointer;
}

.follow-btn:hover {
  color: #00376b;
}

.post-content {
  padding: 16px;
  min-height: 100px;
  overflow-y: auto;
}

.content-user-info {
  display: flex;
  gap: 12px;
}

.content-profile-image {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.content-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.content-top {
  display: block;
}

.content-nickname {
  font-weight: 600;
  color: #262626;
  font-size: 14px;
  float: left;
  margin-right: 8px;
}

.content-body {
  color: #262626;
  word-break: break-word;
  font-size: 14px;
  overflow: visible;
}

.hashtags {
  color: #00376b;
  margin-bottom: 0;
}

.hashtag {
  color: #0095f6;
  margin-right: 8px;
  cursor: pointer;
  font-size: 14px;
}

.content-bottom {
  margin-top: 0;
}

.created-time {
  font-size: 12px;
  color: #737373;
}

.comments-section {
  padding: 0 16px 16px 16px;  /* top right bottom left */
  border-top: none;
  flex: 1;
  overflow-y: auto;
}

.comment {
  margin-bottom: 16px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.comment-user-info {
  display: flex;
  gap: 12px;
  flex: 1;
}

.comment-profile-image {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comment-top {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.nickname {
  font-weight: 600;
  color: #262626;
  font-size: 14px;
}

.comment-content {
  color: #262626;
  word-break: break-word;
  font-size: 14px;
}

.comment-bottom {
  display: flex;
  gap: 12px;
  align-items: center;
}

.like-count {
  font-size: 12px;
  color: #737373;
  font-weight: 600;
}

.comment-like-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
}

.comment-like-btn i {
  font-size: 12px;
  color: #262626;
}

.comment-like-btn i.liked {
  color: #ed4956;
}

.comment-like-btn:hover {
  opacity: 0.7;
}

.post-actions {
  padding: 8px 16px;
}

.left-actions {
  display: flex;
}

.action-button {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
}

.action-button i {
  font-size: 22px;
  color: #262626;
}

.action-button i.far.fa-heart {
  color: #262626;
}

.action-button i.fas.fa-heart.liked {
  color: #ed4956;
}

.action-button:hover {
  opacity: 0.7;
}

.likes-count {
  padding: 0 16px;
  margin-bottom: 8px;
}

.likes-count strong {
  font-weight: 600;
  color: #262626;
  font-size: 14px;
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
  font-size: 14px;
}

.comment-input button.active {
  opacity: 1;
  cursor: pointer;
}

/* 이미지 슬라이더 버튼 스타일 개선 */
.slider-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #262626;
  font-size: 18px;
}

.prev {
  left: 16px;
}

.next {
  right: 16px;
}

.image-dots {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
}

.dot.active {
  background: white;
}

.loading {
  color: white;
  font-size: 14px;
}

.reply-button {
  border: none;
  background: none;
  color: #737373;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.reply-button:hover {
  color: #262626;
}

.reply-input {
  display: flex;
  padding: 8px 0 8px 44px; /* 프로필 이미지 너비 + 여백만큼 들여쓰기 */
  margin-top: 4px;
}

.reply-input input {
  flex: 1;
  border: none;
  outline: none;
  padding: 8px;
  color: #262626;
  font-size: 14px;
}

.reply-input input::placeholder {
  color: #8e8e8e;
}

.reply-input button {
  border: none;
  background: none;
  color: #0095f6;
  font-weight: 600;
  opacity: 0.3;
  cursor: not-allowed;
  font-size: 14px;
}

.reply-input button.active {
  opacity: 1;
  cursor: pointer;
}

.view-replies {
  padding-left: 44px;
  margin: 8px 0;
}

.view-replies-btn {
  border: none;
  background: none;
  color: #737373;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.reply-line {
  display: inline-block;
  width: 24px;
  height: 1px;
  background-color: #737373;
}

.view-replies-btn:hover {
  color: #262626;
}

.replies {
  padding-left: 44px;
}

.reply {
  margin-top: 12px;
}

.delete-button {
  border: none;
  background: none;
  color: #737373;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.delete-button:hover {
  color: #ed4956;
}

.deleted {
  text-decoration: line-through;
  font-style: italic;
  color: #737373;
  font-size: 12px;
}

@media (max-width: 768px) {
  .modal-content {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }
  
  .post-container {
    flex-direction: column;
  }
  
  .image-slider {
    width: 100%;
    height: 50%;
  }
  
  .post-info {
    width: 100%;
    height: 50%;
  }
}
</style>
