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
                <button v-if="post.isFollow === 'N' || isAnimating" 
                        class="follow-btn" 
                        @click="followUser(post.userId)"
                        :disabled="followLoading || isAnimating">
                  <span v-if="followLoading" class="loading-spinner"></span>
                  <span v-else-if="showCheck" class="check-icon">✓</span>
                  <span v-else>팔로우</span>
                </button>
              </div>
            </div>
            <button v-if="post.userId === currentUserId" 
                    class="more-options-btn"
                    @click="showPostOptionsModal">
              <i class="fas fa-ellipsis-v"></i>
            </button>
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
                      <span class="like-count" 
                            v-if="comment.likeCount > 0" 
                            @click="showCommentLikeList(comment.id)">
                        좋아요 {{ comment.likeCount }}개
                      </span>
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
          <div class="likes-count" @click="showLikeList(post.postId)">
            <strong style="cursor: pointer;">좋아요 {{ post.postLikeCount }}개</strong>
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
              v-if="like.isFollow === 'N' || like.isAnimating" 
              class="follow-button"
              :class="{ 'fade-out': like.isFollow === 'Y' }"
              @click="followLikeUser(like.id, false)"
              :disabled="like.followLoading"
            >
              <span v-if="like.followLoading" class="loading-spinner"></span>
              <span v-else>팔로우</span>
            </button>
          </div>
          <div v-if="loading" class="loading-more">
            <div class="loading-spinner"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 댓글 좋아요 목록 모달 -->
    <div v-if="showCommentLikesModal" class="likes-modal-overlay" @click.self="closeCommentLikesModal">
      <div class="likes-modal">
        <div class="likes-modal-header">
          <h2>좋아요</h2>
          <button class="close-modal-btn" @click="closeCommentLikesModal">×</button>
        </div>
        
        <div class="likes-list">
          <div v-for="like in commentLikes" 
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
              v-if="like.isFollow === 'N' || like.isAnimating" 
              class="follow-button"
              :class="{ 'fade-out': like.isFollow === 'Y' }"
              @click="followLikeUser(like.id, true)"
              :disabled="like.followLoading"
            >
              <span v-if="like.followLoading" class="loading-spinner"></span>
              <span v-else>팔로우</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 게시물 옵션 모달 -->
    <div v-if="showOptionsModal" class="modal-overlay" @click.self="closeOptionsModal">
      <div class="options-modal">
        <button class="option-btn delete" @click="deletePost">삭제</button>
        <button class="option-btn edit" @click="editPost">수정</button>
        <button class="option-btn cancel" @click="closeOptionsModal">취소</button>
      </div>
    </div>
  </div>
</template>

<script>
import { jwtDecode } from 'jwt-decode'
import axios from 'axios'

export default {
  name: 'PostDetail',
  data() {
    return {
      post: null,
      currentImageIndex: 0,
      newComment: '',
      followLoading: false,
      showCheck: false,
      isAnimating: false,
      showLikesModal: false,
      likes: [],
      filteredLikes: [],
      searchQuery: '',
      likesPage: 0,
      hasMoreLikes: true,
      loading: false,
      showCommentLikesModal: false,
      commentLikes: [],
      showOptionsModal: false,
      currentUserId: null
    }
  },
  async created() {
    // 현재 사용자 ID 설정
    const token = localStorage.getItem('token')
    if (token) {
      const decoded = jwtDecode(token)
      this.currentUserId = Number(decoded.sub)
    }

    // 게시물 상세 정보 로드
    const postId = this.$route.params.postId
    try {
      const response = await axios.get(
        `${process.env.VUE_APP_API_BASE_URL}/post/detail/${postId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      // 해시태그 처리
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
      console.log('닫기 버튼 클릭됨');
      console.log('현재 route:', this.$route);
      
      const { from, userId } = this.$route.query;
      console.log('파라미터:', { from, userId });
      
      if (from === 'profile') {
        // userId가 없어도 post.userId를 사용
        const profileId = userId || this.post.userId;
        console.log(`프로필(${profileId})로 이동`);
        this.$router.push(`/profile/${profileId}`);
      } else {
        console.log('홈으로 이동');
        this.$router.push('/');
      }
    },
    async toggleLike() {
      try {
        console.log("좋아요 시작")
        console.log(this.post.postId);
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/post/like/${this.post.postId}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
          }
        )
        console.log(response)
        if (response.data.status_code === 200) {
          // 좋아요 상태 토글
          this.post.isLike = this.post.isLike === 'Y' ? 'N' : 'Y'
          // 좋아요 수 업데이트
          this.post.postLikeCount = Number(this.post.postLikeCount) + (this.post.isLike === 'Y' ? 1 : -1)
        }
      } catch (error) {
        console.error('좋아요 토글 실패:', error)
      }
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
          // 댓글 목록 새로고침
          await this.fetchPostDetail()
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
          this.newComment = ''
          // 댓글 목록 새로고침
          await this.fetchPostDetail()
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
            content: comment.replyContent,
            parentId: comment.id
          },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        if (response.data.status_code === 200) {
          comment.replyContent = '';
          comment.showReplyInput = false;
          comment.showReplies = true;
          // 댓글 목록 새로고침
          await this.fetchPostDetail();
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
      // window.location.href 대신 router 사용
      this.$router.push(`/profile/${userId}`);
    },
    isCommentAuthor(comment) {
      return this.currentUserId && this.currentUserId === comment.userId;
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
    },
    async fetchPostDetail() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/post/detail/${this.$route.params.postId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        )
        
        let cleanedHashTags = response.data.result.hashTag.map(tag => {
          return tag.replace(/[[\]"\\s]/g, '');
        }).filter(tag => tag !== '');
        
        response.data.result.hashTag = cleanedHashTags;
        this.post = response.data.result
      } catch (error) {
        console.error('게시물 로드 실패:', error)
      }
    },
    async followUser(userId) {
      if (this.followLoading || this.isAnimating) return;
      
      this.followLoading = true;
      this.isAnimating = true;
      const startTime = Date.now();
      
      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/follow/toggle/${userId}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
          }
        );
        
        if (response.data.status_code === 200) {
          // 최소 1.5초 대기
          const elapsedTime = Date.now() - startTime;
          if (elapsedTime < 1500) {
            await new Promise(resolve => setTimeout(resolve, 1500 - elapsedTime));
          }
          
          this.followLoading = false;
          this.showCheck = true;
          
          // 체크 아이콘 0.8초 표시 후 버튼 제거
          await new Promise(resolve => setTimeout(resolve, 800));
          this.showCheck = false;
          this.post.isFollow = 'Y';
          await new Promise(resolve => setTimeout(resolve, 200));
          this.isAnimating = false;
        }
      } catch (error) {
        console.error('팔로우 실패:', error);
        this.followLoading = false;
        this.isAnimating = false;
      }
    },
    async showLikeList(postId) {
      this.showLikesModal = true;
      this.likes = [];
      this.likesPage = 0;
      this.hasMoreLikes = true;
      await this.fetchLikes(postId);
    },
    async fetchLikes(postId) {
      if (this.loading || !this.hasMoreLikes) return;
      
      this.loading = true;
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/post/like/list/${postId}`,
          {
            params: {
              page: this.likesPage,
              size: 10
            },
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
          }
        );

        const newLikes = response.data.result.content.map(like => ({
          ...like,
          followLoading: false,
          isAnimating: false
        }));
        
        this.likes = [...this.likes, ...newLikes];
        this.filterLikes();
        
        this.hasMoreLikes = newLikes.length === 10;
        this.likesPage++;
      } catch (error) {
        console.error('좋아요 목록 로드 실패:', error);
      } finally {
        this.loading = false;
      }
    },
    filterLikes() {
      if (!this.searchQuery) {
        this.filteredLikes = this.likes;
        return;
      }
      
      this.filteredLikes = this.likes.filter(like =>
        like.nickName.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    },
    closeLikesModal() {
      this.showLikesModal = false;
      this.searchQuery = '';
      this.likes = [];
    },
    async showCommentLikeList(commentId) {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/comment/like/list/${commentId}`,
          {
            params: {
              page: 0,
              size: 10
            },
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
          }
        );
        
        this.commentLikes = response.data.result.content.map(like => ({
          ...like,
          followLoading: false,
          isAnimating: false
        }));
        this.showCommentLikesModal = true;
      } catch (error) {
        console.error('댓글 좋아요 목록 로드 실패:', error);
      }
    },
    closeCommentLikesModal() {
      this.showCommentLikesModal = false;
      this.commentLikes = [];
    },
    showPostOptionsModal() {
      this.showOptionsModal = true;
    },
    closeOptionsModal() {
      this.showOptionsModal = false;
    },
    editPost() {
      this.$router.push(`/post/edit/${this.post.postId}`);
      this.closeOptionsModal();
    },
    async deletePost() {
      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/post/delete/${this.post.postId}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        if (response.data.status_code === 200) {
          this.$router.push('/');
        }
      } catch (error) {
        console.error('게시물 삭제 실패:', error);
      }
    },
    async followLikeUser(userId, isCommentLike = false) {
      const likes = isCommentLike ? this.commentLikes : this.likes;
      const like = likes.find(l => l.id === userId);
      
      if (!like || like.followLoading || like.isAnimating) return;
      
      like.followLoading = true;
      like.isAnimating = true;
      
      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/follow/toggle/${userId}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
          }
        );
        
        if (response.data.status_code === 200) {
          like.followLoading = false;
          like.isFollow = 'Y';
          
          // 게시물 작성자가 팔로우된 경우 게시물의 팔로우 상태도 업데이트
          if (this.post && this.post.userId === userId) {
            this.post.isFollow = 'Y';
          }
          
          // 애니메이션 후 버튼 숨기기
          setTimeout(() => {
            like.isAnimating = false;
          }, 300);
        }
      } catch (error) {
        console.error('팔로우 실패:', error);
        like.followLoading = false;
        like.isAnimating = false;
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
  position: relative;
  min-width: 70px; 
  background: none;
  border: none;
  color: #0095f6;
  font-weight: 600;
  font-size: 14px;
  padding: 0;
  cursor: pointer;
}

.loading-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid #0095f6;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.follow-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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
  cursor: pointer;
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

.likes-count {
  padding: 0 16px;
  margin: 8px 0;
  cursor: pointer;
}

.likes-count:hover {
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

.check-icon {
  display: inline-block;
  color: #0095f6;
  font-size: 14px;
  animation: popIn 0.3s ease;
}

@keyframes popIn {
  0% {
    transform: scale(0);
  }
  70% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
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

.follow-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-more {
  display: flex;
  justify-content: center;
  padding: 16px;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #dbdbdb;
  border-top-color: #0095f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.more-options-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #262626;
}

.more-options-btn i {
  font-size: 20px;
}

.more-options-btn:hover {
  opacity: 0.7;
}

.options-modal {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  width: 400px;
}

.option-btn {
  width: 100%;
  padding: 14px 0;
  border: none;
  background: none;
  font-size: 14px;
  cursor: pointer;
  border-bottom: 1px solid #dbdbdb;
}

.option-btn:last-child {
  border-bottom: none;
}

.option-btn.delete {
  color: #ed4956;
  font-weight: 700;
}

.option-btn.edit {
  color: #262626;
  font-weight: 600;
}

.option-btn.cancel {
  color: #262626;
}

.option-btn:hover {
  background-color: #fafafa;
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
</style>
