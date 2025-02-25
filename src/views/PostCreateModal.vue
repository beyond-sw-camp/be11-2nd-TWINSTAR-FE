<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <div class="header-left">
          <button class="back-button" @click="goBack" v-if="selectedImage">
            <i class="fas fa-arrow-left"></i>
          </button>
        </div>
        <div class="header-center">
          <h3>{{ headerTitle }}</h3>
        </div>
        <div class="header-right">
          <button class="next-button" @click="nextStep" v-if="selectedImage && step === 1">
            다음
          </button>
          <button 
            class="share-button" 
            @click="sharePost" 
            v-if="step === 2"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? '공유 중...' : '공유하기' }}
          </button>
          <button class="close-button" @click="closeModal" v-if="!selectedImage">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <div class="modal-body">
        <!-- 파일 업로드창  -->
        <div v-if="step === 1">
          <div v-if="!selectedImage" class="upload-section">
            <div class="upload-icon">
              <i class="fas fa-image"></i>
            </div>
            <p>사진과 동영상을 넣어보세요</p>
            <label class="upload-button">
              파일 가져오기
              <input 
                type="file" 
                accept="image/*" 
                @change="handleImageSelect" 
                hidden
              >
            </label>
          </div>
          <div v-else class="image-preview" :class="currentAspectRatio">
            <div class="image-wrapper" :style="imageWrapperStyle">
              <img 
                :src="currentImage" 
                alt="Selected image"
                :style="imageStyle"
              >
              <!-- 이미지 슬라이드 컨트롤 -->
              <button 
                v-if="currentImageIndex > 0" 
                class="slide-button prev" 
                @click="prevImage"
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="white" stroke-width="2" d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <button 
                v-if="currentImageIndex < images.length - 1" 
                class="slide-button next" 
                @click="nextImage"
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="white" stroke-width="2" d="M9 18l6-6-6-6"/>
                </svg>
              </button>
              <!-- 이미지 인디케이터 -->
              <div v-if="images.length > 1" class="image-indicators">
                <span 
                  v-for="(_, index) in images" 
                  :key="index"
                  :class="{ active: currentImageIndex === index }"
                ></span>
              </div>
            </div>
            <div class="image-controls">
              <div class="aspect-ratio-menu" v-if="showAspectRatioMenu">
                <button class="ratio-option" @click="setAspectRatio('original')">
                  <span>원본</span>
                </button>
                <button class="ratio-option" @click="setAspectRatio('1:1')">
                  <span>1:1</span>
                </button>
                <button class="ratio-option" @click="setAspectRatio('4:5')">
                  <span>4:5</span>
                </button>
                <button class="ratio-option" @click="setAspectRatio('16:9')">
                  <span>16:9</span>
                </button>
              </div>
              <button class="control-button" @click="toggleAspectRatioMenu">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 3H21V9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9 21H3V15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M21 3L14 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M3 21L10 14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button class="control-button" @click="addMoreImages">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" stroke-width="2"/>
                  <path d="M12 8v8M8 12h8" stroke="white" stroke-width="2"/>
                </svg>
              </button>
              <input 
                type="file"
                ref="additionalImageInput"
                @change="handleAdditionalImage"
                accept="image/*"
                multiple
                hidden
              >
            </div>
          </div>
        </div>

        <!-- 게시글 작성 -->
        <div v-if="step === 2" class="post-creation">
          <div class="post-content">
            <div class="text-box">
              <textarea
                class="post-textarea"
                v-model="caption"
                placeholder="어서오세요"
                rows="8"
              ></textarea>
              <div class="hashtag-input">
                <input
                  type="text"
                  v-model="hashtag"
                  placeholder="해시태그 후 Enter"
                  @keyup.enter="addHashtag"
                >
              </div>
            </div>
            <div class="post-options">
              <div class="dropdown-container">
                <button class="option-button" @click="togglePrivacyDropdown">
                  {{ selectedPrivacy }} <i class="fas fa-chevron-down"></i>
                </button>
                <div class="privacy-dropdown" v-if="showPrivacyDropdown">
                  <button 
                    class="privacy-option"
                    :class="{ active: selectedPrivacy === '전체공개' }"
                    @click="selectPrivacy('전체공개')"
                  >
                    전체공개
                  </button>
                  <button 
                    class="privacy-option"
                    :class="{ active: selectedPrivacy === '팔로워만' }"
                    @click="selectPrivacy('팔로워만')"
                  >
                    팔로워만
                  </button>
                  <button 
                    class="privacy-option"
                    :class="{ active: selectedPrivacy === '모두공개' }"
                    @click="selectPrivacy('모두공개')"
                  >
                    모두공개
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 뒤로가기 할 때 확인창 -->
    <div v-if="showConfirmDialog" class="confirm-dialog-overlay" @click.stop>
      <div class="confirm-dialog">
        <h4>전으로 돌아가시겠어요?</h4>
        <p>수정사항은 모두 취소됩니다.</p>
        <div class="dialog-buttons">
          <button class="cancel-button" @click="cancelGoBack">취소</button>
          <button class="confirm-button" @click="confirmGoBack">확인</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useStore } from 'vuex';
import { v4 as uuidv4 } from 'uuid';

export default {
  name: 'PostCreateModal',
  setup() {
    const store = useStore();
    return { store };
  },
  data() {
    return {
      step: 1,
      selectedImage: null,
      caption: '',
      username: '사용자이름', // 실제 사용자 이름으로 대체
      userProfile: '/default-profile.png', // 실제 프로필 이미지로 대체
      showConfirmDialog: false, // 확인 대화상자 표시 여부
      showAspectRatioMenu: false,
      currentAspectRatio: 'original',
      imageWidth: 0,
      imageHeight: 0,
      images: [],
      currentImageIndex: 0,
      showPrivacyDropdown: false,
      selectedPrivacy: '전체공개',
      hashtag: '',
      hashtags: [],
      isSubmitting: false,
    }
  },
  computed: {
    headerTitle() {
      if (!this.selectedImage) {
        return '새 게시물 만들기';
      }
      if (this.step === 1) {
        return '수정하기';
      }
      return '게시글 작성하기';
    },
    aspectRatioValue() {
      switch(this.currentAspectRatio) {
        case '1:1': return 1;
        case '4:5': return 0.8;
        case '16:9': return 16/9;
        default: return this.imageWidth / this.imageHeight;
      }
    },
    imageWrapperStyle() {
      if (this.currentAspectRatio === 'original') {
        return {};
      }
      
      return {
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
      };
    },
    imageStyle() {
      if (this.currentAspectRatio === 'original') {
        return {
          maxWidth: '100%',
          maxHeight: '100%'
        };
      }

      const containerWidth = 600; // 컨테이너 기본 너비
      const containerHeight = 600; // 컨테이너 기본 높이
      const containerRatio = containerWidth / containerHeight;
      const targetRatio = this.aspectRatioValue;

      if (targetRatio > containerRatio) {
        // 이미지가 더 넓은 경우
        return {
          width: '100%',
          height: 'auto',
          objectFit: 'cover'
        };
      } else {
        // 이미지가 더 높은 경우
        return {
          width: 'auto',
          height: '100%',
          objectFit: 'cover'
        };
      }
    },
    currentImage() {
      return this.images[this.currentImageIndex];
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },
    handleImageSelect(event) {
      const files = event.target.files;
      if (files.length > 0) {
        this.addImagesToArray(files);
      }
    },
    handleAdditionalImage(event) {
      const files = event.target.files;
      if (files.length > 0) {
        this.addImagesToArray(files);
      }
    },
    addImagesToArray(files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            this.imageWidth = img.width;
            this.imageHeight = img.height;
            this.images.push(e.target.result);
            if (this.images.length === 1) {
              this.selectedImage = e.target.result;
            }
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    },
    addMoreImages() {
      this.$refs.additionalImageInput.click();
    },
    prevImage() {
      if (this.currentImageIndex > 0) {
        this.currentImageIndex--;
      }
    },
    nextImage() {
      if (this.currentImageIndex < this.images.length - 1) {
        this.currentImageIndex++;
      }
    },
    nextStep() {
      this.step = 2
    },
    goBack() {
      this.showConfirmDialog = true; // 확인 대화상자 표시
    },
    cancelGoBack() {
      this.showConfirmDialog = false; // 대화상자 닫기
    },
    confirmGoBack() {
      this.showConfirmDialog = false; // 대화상자 닫기
      if (this.step === 2) {
        this.step = 1;
      } else {
        this.selectedImage = null;
      }
    },
    rotateImage() {
      // 이미지 회전 로직 구현
    },
    cropImage() {
      // 이미지 자르기 로직 구현
    },
    async sharePost() {
      try {
        this.isSubmitting = true;

        const postData = {
          id: uuidv4(), // 고유 ID 생성
          images: this.images,
          aspectRatio: this.currentAspectRatio,
          caption: this.caption,
          hashtags: this.hashtags,
          privacy: this.selectedPrivacy,
          createdAt: new Date().toISOString(),
          likes: 0,
          comments: [],
          userId: this.store.state.user.id, // 현재 로그인한 사용자 ID
        };

        // Vuex store에 게시물 추가
        await this.store.dispatch('posts/addPost', postData);

        // 성공 메시지 표시
        this.$toast.success('게시물이 업로드되었습니다.');
        
        // 모달 닫기
        this.closeModal();

      } catch (error) {
        console.error('Post creation failed:', error);
        this.$toast.error('게시물 업로드에 실패했습니다. 다시 시도해주세요.');
      } finally {
        this.isSubmitting = false;
      }
    },
    toggleAccessibility() {
      // 접근성 토글 로직
    },
    toggleAdvancedSettings() {
      // 고급 설정 토글 로직
    },
    toggleAspectRatioMenu() {
      this.showAspectRatioMenu = !this.showAspectRatioMenu;
    },
    setAspectRatio(ratio) {
      this.currentAspectRatio = ratio;
      this.showAspectRatioMenu = false;
    },
    togglePrivacyDropdown() {
      this.showPrivacyDropdown = !this.showPrivacyDropdown;
    },
    selectPrivacy(privacy) {
      this.selectedPrivacy = privacy;
      this.showPrivacyDropdown = false;
    },
    addHashtag() {
      if (this.hashtag.trim()) {
        this.hashtags.push(this.hashtag.trim());
        this.hashtag = '';
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
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.65);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 85%;
  max-width: 900px;
  height: auto;
  min-height: 550px;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  padding: 12px 16px;
  border-bottom: 1px solid #dbdbdb;
  display: grid;
  grid-template-columns: 1fr auto 1fr; /* 3등분 그리드 */
  align-items: center;
}

.header-left {
  justify-self: start;
}

.header-center {
  text-align: center;
}

.header-right {
  justify-self: end;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.back-button,
.close-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 8px;
  color: #262626;
}

.next-button,
.share-button {
  background: none;
  border: none;
  color: #0095f6;
  font-weight: 600;
  cursor: pointer;
  padding: 8px;
}

.modal-body {
  height: calc(100% - 43px);
  display: flex;
  flex-direction: column;
  background: white;
}

.upload-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px;
  background: white;
}

.upload-icon {
  font-size: 72px;
  color: #8e8e8e;
  margin-bottom: 24px;
}

.upload-section p {
  color: #262626;
  font-size: 16px;
  margin-bottom: 16px;
}

.upload-button {
  background-color: #0095f6;
  color: white;
  padding: 7px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}

.image-preview {
  position: relative;
  width: 100%;
  height: 600px;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-preview.1\:1 .image-wrapper {
  aspect-ratio: 1/1;
}

.image-preview.4\:5 .image-wrapper {
  aspect-ratio: 4/5;
}

.image-preview.16\:9 .image-wrapper {
  aspect-ratio: 16/9;
}

.image-preview img {
  max-width: 600px;
  max-height: 600px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.image-controls {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  gap: 12px;
}

.control-button {
  background: rgba(0, 0, 0, 0.75);
  border: none;
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background-color 0.2s;
}

.control-button:hover {
  background: rgba(0, 0, 0, 0.85);
}

.control-button svg {
  width: 16px;
  height: 16px;
}

.post-creation {
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.post-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.text-box {
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.post-textarea {
  width: 100%;
  border: none;
  resize: none;
  font-size: 16px;
  line-height: 1.5;
  padding: 0;
  outline: none;
  min-height: 150px;
  margin-bottom: 12px; /* 해시태그 입력창과의 간격 */
}

.post-textarea::placeholder {
  color: #8e8e8e;
}

.hashtag-input {
  border-top: 1px solid #dbdbdb;
  padding-top: 12px;
}

.hashtag-input input {
  width: 100%;
  border: none;
  font-size: 14px;
  outline: none;
  color: #262626;
}

.hashtag-input input::placeholder {
  color: #8e8e8e;
}

.post-options {
  margin-top: 30px;
  padding-top: 16px;
}

.option-button {
  background: none;
  border: none;
  padding: 8px 0;
  color: #262626;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.option-button i {
  font-size: 12px;
  color: #8e8e8e;
}

/* 모바일 반응형 */
@media screen and (max-width: 768px) {
  .post-creation {
    padding: 16px;
  }
  
  .text-box {
    padding: 10px;
  }
  
  .post-textarea {
    font-size: 14px;
    min-height: 120px;
  }
  
  .option-button {
    font-size: 13px;
  }

  .hashtag-input {
    padding-top: 10px;
  }

  .hashtag-input input {
    font-size: 13px;
  }
}

.image-edit {
  flex: 1;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.image-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.bottom-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
}

.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.65);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100; /* 기존 모달보다 위에 표시 */
}

.confirm-dialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  text-align: center;
}

.confirm-dialog h4 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
}

.confirm-dialog p {
  margin: 0 0 24px 0;
  color: #8e8e8e;
  font-size: 14px;
}

.dialog-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.dialog-buttons button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
}

.cancel-button {
  background: #dbdbdb;
  color: #262626;
}

.confirm-button {
  background: #0095f6;
  color: white;
}

.cancel-button:hover {
  background: #c7c7c7;
}

.confirm-button:hover {
  background: #1877f2;
}

.aspect-ratio-menu {
  position: absolute;
  bottom: 48px;
  left: 0;
  background: rgba(0, 0, 0, 0.75);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ratio-option {
  background: transparent;
  border: none;
  color: white;
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  text-align: left;
  font-size: 14px;
  transition: background-color 0.2s;
}

.ratio-option:hover {
  background: rgba(255, 255, 255, 0.1);
}

.ratio-option.active {
  color: #0095f6;
}

/* 반응형 스타일 */
@media screen and (max-width: 768px) {
  .aspect-ratio-menu {
    bottom: 40px;
    padding: 6px;
  }

  .ratio-option {
    padding: 6px 12px;
    font-size: 12px;
  }
}

.slide-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.slide-button:hover {
  background: rgba(0, 0, 0, 0.8);
}

.slide-button.prev {
  left: 16px;
}

.slide-button.next {
  right: 16px;
}

.image-indicators {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
}

.image-indicators span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transition: background-color 0.2s;
}

.image-indicators span.active {
  background: #0095f6;
}

@media screen and (max-width: 768px) {
  .slide-button {
    width: 28px;
    height: 28px;
  }
  
  .slide-button.prev {
    left: 8px;
  }
  
  .slide-button.next {
    right: 8px;
  }
}

.dropdown-container {
  position: relative;
}

.privacy-dropdown {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 120px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  margin-bottom: 8px;
  overflow: hidden;
  border: 1px solid #dbdbdb;
}

.privacy-option {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  text-align: left;
  font-size: 14px;
  cursor: pointer;
  color: #262626;
  display: block;
}

.privacy-option:hover {
  background-color: #f8f8f8;
}

.privacy-option.active {
  color: #0095f6;
}

.privacy-option + .privacy-option {
  border-top: 1px solid #dbdbdb;
}

/* 모바일 반응형 */
@media screen and (max-width: 768px) {
  .privacy-dropdown {
    width: 110px;
  }

  .privacy-option {
    padding: 10px 14px;
    font-size: 13px;
  }
}

.share-button {
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
