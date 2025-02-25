<template>
  <div class="modal-overlay" @click="handleOverlayClick">
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
          <button class="close-button" @click="closeModal" v-if="step === 2 || !selectedImage">
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
                @mousedown="startDrag"
                @mousemove="onDrag"
                @mouseup="stopDrag"
                @mouseleave="stopDrag"
                @touchstart="startDrag"
                @touchmove="onDrag"
                @touchend="stopDrag"
                ref="imageElement"
              >
              <!-- 삭제 버튼 추가 -->
              <button class="delete-image-button" @click="deleteCurrentImage">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="rgba(0, 0, 0, 0.5)"/>
                  <path d="M16 8L8 16M8 8l8 8" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
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
              <!-- 이미지 수정기능 -->
              <div v-if="images.length > 1" class="image-indicators">
                <span 
                  v-for="(_, index) in images" 
                  :key="index"
                  :class="{ active: currentImageIndex === index }"
                ></span>
              </div>
              <!-- 3x3 그리드 오버레이 추가 -->
              <div class="grid-overlay" :class="{ 'show-grid': isDragging }">
                <div class="grid-lines vertical">
                  <div class="grid-line"></div>
                  <div class="grid-line"></div>
                </div>
                <div class="grid-lines horizontal">
                  <div class="grid-line"></div>
                  <div class="grid-line"></div>
                </div>
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
              <!-- 줌 슬라이더 컨트롤 추가 -->
              <div class="zoom-control" v-if="isZoomed">
                <div class="zoom-slider-container">
                  <input 
                    type="range" 
                    class="zoom-slider" 
                    :min="minScale * 100" 
                    :max="maxScale * 100" 
                    :value="scale * 100"
                    @input="handleZoomSlider"
                  >
                </div>
              </div>
              <!-- 줌 토글 버튼 -->
              <button class="control-button" @click="toggleZoom" data-type="zoom">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="7" stroke="white" stroke-width="2"/>
                  <path d="M16 16l4 4" stroke="white" stroke-width="2" stroke-linecap="round"/>
                  <path d="M11 8v6M8 11h6" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
              <!-- 비율 조정 로직 -->
              <button class="control-button" @click="toggleAspectRatioMenu" data-type="aspect-ratio">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 3H21V9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9 21H3V15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M21 3L14 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M3 21L10 14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <!-- 사진 추가 로직 -->
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
                placeholder="여기에 입력해주세요"
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
              <button 
                class="share-button" 
                @click="sharePost" 
                :disabled="isSubmitting"
              >
                {{ isSubmitting ? '공유 중...' : '공유하기' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 모달 닫기 확인 대화상자 -->
    <div v-if="showConfirmDialog" class="confirm-dialog-overlay" @click.stop>
      <div class="confirm-dialog">
        <h4>게시물을 삭제하시겠어요?</h4>
        <p>지금 나가시면 수정내용이 저장되지 않습니다.</p>
        <div class="dialog-buttons">
          <button class="cancel-button" @click="cancelClose">취소</button>
          <button class="confirm-button" @click="confirmClose">삭제</button>
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
      showConfirmDialog: false,
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
      isZoomed: false,
      scale: 1,
      minScale: 1,
      maxScale: 2,
      translateX: 0,
      translateY: 0,
      isDragging: false,
      startX: 0,
      startY: 0,
      lastTranslateX: 0,
      lastTranslateY: 0,
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
      return {
        maxWidth: '100%',
        maxHeight: '100%',
        transform: `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`,
        cursor: this.isZoomed ? (this.isDragging ? 'grabbing' : 'grab') : 'default',
        transition: this.isDragging ? 'none' : 'transform 0.3s',
        userSelect: 'none',
        WebkitUserDrag: 'none'
      }
    },
    currentImage() {
      return this.images[this.currentImageIndex];
    }
  },
  methods: {
    handleOverlayClick(event) {
      if (event.target.classList.contains('modal-overlay')) {
        if (this.selectedImage) {
          this.showCloseConfirmDialog();
        } else {
          this.$emit('close');
        }
      }
    },
    closeModal() {
      if (this.selectedImage) {
        this.showCloseConfirmDialog();
      } else {
        this.$emit('close');
      }
    },
    showCloseConfirmDialog() {
      this.showConfirmDialog = true;
    },
    cancelClose() {
      this.showConfirmDialog = false;
    },
    confirmClose() {
      this.showConfirmDialog = false;
      this.$emit('close');
    },
    handleImageSelect(event) {
      const files = event.target.files;
      if (files.length > 0) {
        this.images = []; // 기존 이미지 배열 초기화
        this.currentImageIndex = 0; // 현재 이미지 인덱스 초기화
        this.addImagesToArray(files);
        this.selectedImage = true; // selectedImage를 true로 설정
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
              this.selectedImage = true; // 여기서도 selectedImage를 true로 설정
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
    async sharePost() {
      try {
        this.isSubmitting = true;

        const postData = {
          id: uuidv4(), 
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
    toggleAspectRatioMenu() {
      this.showAspectRatioMenu = !this.showAspectRatioMenu;
    },
    setAspectRatio(ratio) {
      this.currentAspectRatio = ratio;
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
    },
    deleteCurrentImage() {
      // 현재 이미지 삭제
      this.images.splice(this.currentImageIndex, 1);
      
      // 이미지가 모두 삭제된 경우
      if (this.images.length === 0) {
        this.selectedImage = null;
        this.currentImageIndex = 0;
        return;
      }
      
      // 마지막 이미지였던 경우 인덱스 조정
      if (this.currentImageIndex >= this.images.length) {
        this.currentImageIndex = this.images.length - 1;
      }
    },
    toggleZoom() {
      // 슬라이더 표시/숨김만 토글
      this.isZoomed = !this.isZoomed;
      // scale과 translate 값은 유지 (초기화하지 않음)
    },
    handleZoomSlider(event) {
      const value = parseFloat(event.target.value);
      this.scale = value / 100;
      
      // 확대/축소 시 현재 위치가 경계를 벗어나지 않도록 조정
      const bounds = this.calculateBounds();
      this.translateX = Math.max(bounds.minX, Math.min(bounds.maxX, this.translateX));
      this.translateY = Math.max(bounds.minY, Math.min(bounds.maxY, this.translateY));
      this.lastTranslateX = this.translateX;
      this.lastTranslateY = this.translateY;
    },
    startDrag(e) {
      if (!this.isZoomed) return; // 확대된 상태에서만 드래그 가능
      this.isDragging = true;
      
      const point = e.touches ? e.touches[0] : e;
      this.startX = point.clientX - this.lastTranslateX;
      this.startY = point.clientY - this.lastTranslateY;
      
      if (e.target.tagName === 'IMG') {
        e.preventDefault(); // 이미지 기본 드래그 방지
      }
    },
    onDrag(e) {
      if (!this.isDragging || !this.isZoomed) return;
      e.preventDefault();
      
      const point = e.touches ? e.touches[0] : e;
      const newTranslateX = point.clientX - this.startX;
      const newTranslateY = point.clientY - this.startY;
      
      // 이미지 경계 제한 계산
      const bounds = this.calculateBounds();
      this.translateX = Math.max(bounds.minX, Math.min(bounds.maxX, newTranslateX));
      this.translateY = Math.max(bounds.minY, Math.min(bounds.maxY, newTranslateY));
    },
    stopDrag() {
      if (this.isDragging) {
        this.lastTranslateX = this.translateX;
        this.lastTranslateY = this.translateY;
      }
      this.isDragging = false;
    },
    calculateBounds() {
      if (!this.$refs.imageElement) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
      
      const img = this.$refs.imageElement;
      const container = img.parentElement;
      const imgRect = img.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const scaledWidth = imgRect.width * this.scale;
      const scaledHeight = imgRect.height * this.scale;
      
      // 이미지가 컨테이너보다 큰 경우에만 드래그 제한
      const minX = Math.min(0, containerRect.width - scaledWidth);
      const maxX = 0;
      const minY = Math.min(0, containerRect.height - scaledHeight);
      const maxY = 0;
      
      return { minX, maxX, minY, maxY };
    },
  },
  mounted() {
  },
  beforeUnmount() {
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
  position: relative;
  background: white;
  width: 100%;
  max-width: 600px;
  height: 90vh;
  max-height: 630px;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 12px 16px;
  border-bottom: 1px solid #dbdbdb;
  display: grid;
  grid-template-columns: 1fr auto 1fr; 
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
  margin-top: 60px;
}

.upload-icon {
  font-size: 72px;
  color: #8e8e8e;
  margin-bottom: 24px;
}

.upload-section p {
  color: #262626;
  font-size: 16px;
  margin-bottom: 24px;
}

.upload-button {
  background-color: #0095f6;
  color: white;
  padding: 7px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  margin-top: 10px;
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
  background-color: white;
  overflow: hidden;
  touch-action: none; /* 모바일에서 기본 터치 동작 방지 */
}

.image-wrapper img {
  user-select: none;
  -webkit-user-drag: none;
  -webkit-touch-callout: none;
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
  bottom: 45px;
  left: 16px;
  display: flex;
  gap: 12px;
  z-index: 10;
}

.control-button {
  background: rgba(0, 0, 0, 0.75);
  border: none;
  color: #fff;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
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
  margin-bottom: 12px;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #dbdbdb;
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
  background: #ed4956;
  color: white;
}

.cancel-button:hover {
  background: #c7c7c7;
}

.confirm-button:hover {
  background: #dc3545;
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
  background: #0095f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.share-button:hover {
  background-color: #1877f2;
}

.share-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.close-button {
  background: none;
  border: none;
  font-size: 18px;
  padding: 8px;
  cursor: pointer;
  color: #262626;
}

.close-button:hover {
  color: #000;
}

/* 모바일 반응형 스타일 */
@media screen and (max-width: 768px) {
  .post-options {
    margin-top: 20px;
    padding-top: 12px;
  }

  .share-button {
    padding: 6px 14px;
    font-size: 14px;
  }

  .close-button {
    font-size: 16px;
    padding: 6px;
  }
}

.delete-image-button {
  position: absolute;
  top: 20px;
  right: 12px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  z-index: 10;
}

.delete-image-button:hover {
  transform: scale(1.1);
}

@media screen and (max-width: 768px) {
  .delete-image-button {
    top: 18px;
    right: 10px;
  }
  
  .delete-image-button svg {
    width: 20px;
    height: 20px;
  }
}

/* 반응형 스타일 추가/수정 */
@media screen and (max-width: 768px) {
  .modal-content {
    width: 100%;
    max-width: 500px;
    height: 100%;
    max-height: none;
    border-radius: 0;
  }

  .modal-header {
    padding: 8px 12px;
  }

  .modal-header h3 {
    font-size: 14px;
  }

  .image-preview {
    height: calc(100vh - 120px); /* 헤더와 하단 컨트롤 영역 고려 */
  }

  .image-wrapper {
    width: 100%;
    height: 100%;
  }

  .image-preview img {
    max-width: 100%;
    max-height: 100%;
  }

  .image-controls {
    bottom: 35px;
    left: 12px;
    gap: 10px;
  }

  .control-button {
    width: 28px;
    height: 28px;
  }

  .aspect-ratio-menu {
    bottom: 40px;
    left: 0;
    padding: 6px;
  }

  .ratio-option {
    padding: 6px 12px;
    font-size: 12px;
  }

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

  .upload-section {
    padding: 16px;
  }

  .upload-icon {
    font-size: 56px;
    margin-bottom: 16px;
  }

  .upload-section p {
    font-size: 14px;
    margin-bottom: 12px;
  }

  .upload-button {
    padding: 6px 14px;
    font-size: 13px;
  }

  /* 게시글 작성 영역 반응형 */
  .post-creation {
    padding: 12px;
  }

  .text-box {
    padding: 8px;
  }

  .post-textarea {
    font-size: 14px;
    min-height: 120px;
  }

  .hashtag-input input {
    font-size: 13px;
  }

  .post-options {
    margin-top: 20px;
    padding-top: 12px;
  }
}

/* 더 작은 화면을 위한 추가 스타일 */
@media screen and (max-width: 480px) {
  .modal-header {
    padding: 6px 10px;
  }

  .upload-icon {
    font-size: 48px;
  }

  .upload-section p {
    font-size: 13px;
  }

  .control-button {
    width: 24px;
    height: 24px;
  }

  .image-controls {
    bottom: 8px;
    left: 8px;
    gap: 6px;
  }
}

.control-button[data-type="zoom"] {
  position: relative;
}

.control-button[data-type="zoom"]::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
  opacity: 0;
  background: rgba(255, 255, 255, 0.1);
  transition: opacity 0.2s;
}

.control-button[data-type="zoom"]:hover::after {
  opacity: 1;
}

@media screen and (max-width: 768px) {
  .control-button {
    width: 28px;
    height: 28px;
  }
  
  .control-button svg {
    width: 14px;
    height: 14px;
  }
}

.zoom-control {
  position: absolute;
  right: -65px;
  top: -25px;
  transform: none;
  background: rgba(0, 0, 0, 0.75);
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
}

.zoom-slider-container {
  width: 160px;
  display: flex;
  align-items: center;
}

.zoom-slider {
  width: 100%;
  height: 2px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.3);
  outline: none;
  border-radius: 1px;
}

.zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.1s;
}

.zoom-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.1s;
}

.zoom-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.zoom-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}

@media screen and (max-width: 768px) {
  .zoom-control {
    right: -48px;
    top: -20px;
    padding: 6px 10px;
  }

  .zoom-slider-container {
    width: 120px;
  }
}

.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}

.grid-overlay.show-grid {
  opacity: 1;
}

.grid-lines {
  position: absolute;
  inset: 0;
}

.grid-lines.vertical {
  display: flex;
  justify-content: space-between;
  padding: 0 33.33%;
}

.grid-lines.horizontal {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 33.33% 0;
  height: 100%; /* 높이 명시 */
}

.grid-line {
  background-color: rgba(255, 255, 255, 0.8); /* 선 투명도 감소 */
  position: relative;
}

.grid-lines.vertical .grid-line {
  width: 1px;
  height: 100%;
}

.grid-lines.horizontal .grid-line {
  width: 100%;
  height: 1px;
  position: absolute; /* 위치 고정 */
}

/* 수평선 위치 지정 */
.grid-lines.horizontal .grid-line:first-child {
  top: 33.33%;
}

.grid-lines.horizontal .grid-line:last-child {
  top: 66.66%;
}

/* 그림자 효과 강화 */
.grid-line::after {
  content: '';
  position: absolute;
  inset: 0;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.7);
}

@media screen and (max-width: 768px) {
  .grid-line {
    background-color: rgba(255, 255, 255, 0.85); /* 모바일에서 더 진하게 */
  }
}
</style>
