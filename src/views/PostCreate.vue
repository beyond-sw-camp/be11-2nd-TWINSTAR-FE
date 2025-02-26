<template>
  <div class="post-create-container">
    <div class="post-create-card">
      <h1 class="title">새 게시물 만들기</h1>
      
      <div class="post-create-layout">
        <!-- 왼쪽: 이미지 업로드 영역 -->
        <div class="left-section">
          <div class="image-upload-area"
               @click="triggerFileInput"
               @dragover.prevent
               @drop.prevent="handleDrop">
            <input type="file" 
                   ref="fileInput" 
                   @change="handleImageUpload" 
                   multiple 
                   accept="image/*" 
                   class="hidden">
            
            <div v-if="imagePreviews.length === 0" class="upload-placeholder">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>이미지를 선택하세요</p>
              <span class="upload-hint">클릭하거나 드래그하여 업로드</span>
            </div>
            
            <div v-else class="image-slider">
              <button v-if="currentImageIndex > 0"
                      @click.stop="prevImage" 
                      class="slider-button prev">
                <i class="fas fa-chevron-left"></i>
              </button>

              <div class="image-preview">
                <img :src="imagePreviews[currentImageIndex]" alt="Preview">
                <div v-if="imagePreviews.length > 1" class="image-counter">
                  {{ currentImageIndex + 1 }} / {{ imagePreviews.length }}
                </div>
              </div>

              <button v-if="currentImageIndex < imagePreviews.length - 1"
                      @click.stop="nextImage" 
                      class="slider-button next">
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- 오른쪽: 컨텐츠 입력 영역 -->
        <div class="right-section">
          <!-- 내용 입력 -->
          <div class="input-group">
            <label>내용</label>
            <textarea 
              v-model="content" 
              placeholder="당신의 이야기를 들려주세요..."
              class="content-input"
            ></textarea>
          </div>

          <!-- 해시태그 입력 -->
          <div class="input-group">
            <label>해시태그</label>
            <div class="hashtag-input-wrapper">
              <input 
                v-model="hashtagInput"
                @keyup.enter="addHashtag"
                placeholder="태그 입력 후 Enter"
                class="hashtag-input"
              >
            </div>
            <div class="hashtag-list">
              <span v-for="(tag, index) in hashtags" 
                    :key="index" 
                    class="hashtag-item">
                #{{ tag }}
                <button @click="removeHashtag(index)" 
                        class="remove-tag-btn">×</button>
              </span>
            </div>
          </div>

          <!-- 공개 범위 선택 -->
          <div class="visibility-group">
            <div class="visibility-options">
              <button class="visibility-btn" 
                      :class="{ active: visibility === 'ALL' }"
                      @click="visibility = 'ALL'">
                <i class="fas fa-globe"></i> 모두에게
              </button>
              <button class="visibility-btn"
                      :class="{ active: visibility === 'FOLLOW' }"
                      @click="visibility = 'FOLLOW'">
                <i class="fas fa-user-friends"></i> 맞팔로워만
              </button>
              <button class="visibility-btn"
                      :class="{ active: visibility === 'ONLYME' }"
                      @click="visibility = 'ONLYME'">
                <i class="fas fa-lock"></i> 나만보기
              </button>
            </div>
          </div>

          <!-- 게시하기 버튼 -->
          <button @click="createPost" 
                  class="submit-btn"
                  :disabled="!content || imagePreviews.length === 0">
            게시하기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'PostCreate',
  data() {
    return {
      content: '',
      hashtagInput: '',
      hashtags: [],
      images: [],
      imagePreviews: [],
      visibility: 'ALL',
      isSubmitting: false,
      currentImageIndex: 0,
      isDragging: false
    }
  },
  methods: {
    handleDrop(event) {
      const files = Array.from(event.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      )
      if (files.length > 0) {
        this.processImages(files)
      }
      this.isDragging = false
    },
    handleImageUpload(event) {
      const files = Array.from(event.target.files)
      this.processImages(files)
    },
    processImages(files) {
      this.imagePreviews = [] // 기존 미리보기 초기화
      this.images = [] //기존 이미지 초기화
      
      files.forEach(file => {
        this.images.push(file) //파일 추가

        const reader = new FileReader()
        reader.onload = (e) => {
          this.imagePreviews.push(e.target.result)
        }
        reader.readAsDataURL(file)
      })
      
      this.currentImageIndex = 0
    },
    prevImage() {
      if (this.currentImageIndex > 0) {
        this.currentImageIndex--
      }
    },
    nextImage() {
      if (this.currentImageIndex < this.imagePreviews.length - 1) {
        this.currentImageIndex++
      }
    },
    addHashtag() {
      const tag = this.hashtagInput.replace(/^#/, '').trim()
      if (tag && !this.hashtags.includes(tag)) {
        this.hashtags.push(tag)
      }
      this.hashtagInput = ''
    },
    removeHashtag(index) {
      this.hashtags.splice(index, 1)
    },
    async createPost() {
      if (this.isSubmitting) return
      
      try {
        this.isSubmitting = true
        const formData = new FormData()
        
        formData.append('content', this.content)
        formData.append('visibility', this.visibility)
        
        if (this.hashtags && this.hashtags.length > 0) {
          formData.append('hashTag', JSON.stringify(this.hashtags))
        } else {
          formData.append('hashTag', JSON.stringify([]))
        }
        
        this.images.forEach(image => {
          formData.append('imageFile', image)
        })

        console.log(formData)
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/post/create`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        )

        console.log('서버 응답:', response.data)

        if (response.data.status_code === 200) {
          const postId = response.data.result
          if (postId) {
            this.$router.push(`/post/detail/${postId}`)
          } else {
            console.error('게시물 ID를 찾을 수 없습니다:', response.data)
            alert('게시물이 작성되었지만 상세 페이지로 이동할 수 없습니다.')
            this.$router.push('/')
          }
        }
      } catch (error) {
        console.error('게시물 작성 실패:', error)
        alert('게시물 작성에 실패했습니다.')
      } finally {
        this.isSubmitting = false
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click()
    }
  },
  mounted() {
    // 드래그 이벤트 리스너 추가
    const imageSection = this.$el.querySelector('.image-upload-area')
    
    imageSection.addEventListener('dragenter', (e) => {
      e.preventDefault()
      this.isDragging = true
    })
    
    imageSection.addEventListener('dragleave', (e) => {
      e.preventDefault()
      const rect = imageSection.getBoundingClientRect()
      if (
        e.clientX < rect.left ||
        e.clientX >= rect.right ||
        e.clientY < rect.top ||
        e.clientY >= rect.bottom
      ) {
        this.isDragging = false
      }
    })
  }
}
</script>

<style scoped>
.post-create-container {
  width: calc(100% - 240px);
  min-height: 100vh;
  margin-left: 240px;
  padding: 20px;
  background-color: #f8f9fa;
  display: flex;
  justify-content: center;
}

.post-create-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1000px;
  padding: 20px;
}

.title {
  text-align: center;
  font-size: 30px;
  font-weight: 600;
  margin-bottom: 45px;
  margin-top: 30px;
  color: #333;
}

.post-create-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.left-section {
  border: 2px dashed #e1e3e8;
  border-radius: 10px;
  min-height: 400px;
  position: relative;
}

.image-upload-area {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.upload-placeholder {
  text-align: center;
  color: #666;
}

.upload-placeholder i {
  font-size: 48px;
  color: #4a90e2;
  margin-bottom: 15px;
}

.right-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-group label {
  font-weight: 600;
  color: #666;
}

.content-input {
  width: 100%;
  min-height: 150px;
  padding: 15px;
  border: 1px solid #e1e3e8;
  border-radius: 8px;
  resize: vertical;
}

.hashtag-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #e1e3e8;
  border-radius: 8px;
}

.hashtag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.hashtag-item {
  background: #f0f2f5;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.visibility-options {
  display: flex;
  gap: 10px;
}

.visibility-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid #e1e3e8;
  border-radius: 8px;
  background: white;
  cursor: pointer;
}

.visibility-btn.active {
  background: #4a90e2;
  color: white;
  border-color: #4a90e2;
}

.submit-btn {
  margin-top: auto;
  padding: 15px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.submit-btn:disabled {
  background: #b2dffc;
  cursor: not-allowed;
}

.hidden {
  display: none;
}

.image-slider {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.slider-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.slider-button:hover {
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.slider-button.prev {
  left: 10px;
}

.slider-button.next {
  right: 10px;
}

.image-counter {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.image-preview img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  transition: all 0.3s ease;
}

/* 이미지 전환 애니메이션 */
.image-preview {
  transition: transform 0.3s ease;
}

.upload-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  width: 100%;
}

@media (max-width: 768px) {
  .post-create-container {
    width: 100%;
    margin-left: 0;
    padding: 10px;
  }

  .post-create-layout {
    grid-template-columns: 1fr;
  }

  .slider-button {
    width: 32px;
    height: 32px;
  }

  .image-counter {
    font-size: 10px;
    padding: 3px 6px;
  }
}
</style>