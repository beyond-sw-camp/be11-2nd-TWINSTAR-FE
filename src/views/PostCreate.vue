<template>
  <div class="post-create-container">
    <div class="post-create-card">
      <h2 class="title">새 게시물 만들기</h2>
      
      <div class="post-create-layout">
        <!-- 왼쪽 영역: 이미지 업로드 -->
        <div class="left-section">
          <div class="image-upload-area" @click="triggerFileInput" 
               :class="{ 'has-images': images.length > 0 }">
            <input type="file" ref="fileInput" @change="handleImageSelect" multiple accept="image/*" class="hidden">
            <div v-if="images.length === 0" class="upload-placeholder">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>이미지를 선택하세요</p>
              <span class="upload-hint">클릭하거나 드래그하여 업로드</span>
            </div>
            <div v-else class="image-preview-container">
              <div v-for="(image, index) in imagePreviews" :key="index" class="image-preview">
                <img :src="image" alt="Preview">
                <button @click.stop="removeImage(index)" class="remove-btn">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 오른쪽 영역: 컨텐츠 입력 -->
        <div class="right-section">
          <div class="input-group">
            <label class="input-label">내용</label>
            <textarea 
              v-model="content" 
              placeholder="당신의 이야기를 들려주세요..."
              class="content-input"
            ></textarea>
          </div>

          <div class="input-group">
            <label class="input-label">해시태그</label>
            <div class="hashtag-wrapper">
              <div class="hashtag-input-container">
                <i class="fas fa-hashtag"></i>
                <input 
                  v-model="hashtagInput"
                  @keyup.enter="addHashtag"
                  @keyup.space="addHashtag"
                  placeholder="태그 입력 후 Enter"
                  class="hashtag-input"
                >
              </div>
              <div class="hashtag-list">
                <span v-for="(tag, index) in hashtags" :key="index" class="hashtag-item">
                  #{{ tag }}
                  <button @click="removeHashtag(index)" class="remove-tag-btn">×</button>
                </span>
              </div>
            </div>
          </div>

          <div class="input-group">
            <label class="input-label">공개 범위</label>
            <div class="visibility-selector">
              <label class="visibility-option">
                <input type="radio" v-model="visibility" value="ALL">
                <span class="visibility-text">
                  <i class="fas fa-globe"></i> 모두에게
                </span>
              </label>
              <label class="visibility-option">
                <input type="radio" v-model="visibility" value="FOLLOW">
                <span class="visibility-text">
                  <i class="fas fa-user-friends"></i> 맞팔로워만
                </span>
              </label>
              <label class="visibility-option">
                <input type="radio" v-model="visibility" value="ONLYME">
                <span class="visibility-text">
                  <i class="fas fa-lock"></i> 나만보기
                </span>
              </label>
            </div>
          </div>

          <button @click="createPost" class="submit-btn" :disabled="isSubmitting">
            <i class="fas fa-paper-plane"></i>
            {{ isSubmitting ? '게시중...' : '게시하기' }}
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
      isSubmitting: false
    }
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    handleImageSelect(event) {
      const files = event.target.files
      for (let file of files) {
        if (file.type.startsWith('image/')) {
          this.images.push(file)
          const reader = new FileReader()
          reader.onload = e => this.imagePreviews.push(e.target.result)
          reader.readAsDataURL(file)
        }
      }
    },
    removeImage(index) {
      this.images.splice(index, 1)
      this.imagePreviews.splice(index, 1)
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
        
        this.hashtags.forEach(tag => {
          formData.append('hashTag', tag)
        })
        
        this.images.forEach(image => {
          formData.append('imageFile', image)
        })

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
    }
  }
}
</script>

<style scoped>
.post-create-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px;
}

.post-create-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
  padding: 40px;
  width: 100%;
  max-width: 1200px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.post-create-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-top: 30px;
}

.left-section {
  border-right: 1px solid #eee;
  padding-right: 40px;
}

.right-section {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-label {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 5px;
}

.image-upload-area {
  border: 2px dashed #4a90e2;
  border-radius: 16px;
  padding: 30px;
  transition: all 0.4s ease;
  background: rgba(74, 144, 226, 0.05);
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.upload-placeholder {
  text-align: center;
}

.upload-placeholder i {
  font-size: 48px;
  color: #4a90e2;
  margin-bottom: 15px;
}

.upload-hint {
  font-size: 13px;
  color: #999;
  margin-top: 10px;
}

.content-input {
  width: 100%;
  min-height: 150px;
  padding: 16px;
  border: 2px solid #e1e3e8;
  border-radius: 12px;
  resize: vertical;
  font-size: 15px;
  transition: all 0.3s ease;
}

.hashtag-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hashtag-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.hashtag-input-container i {
  position: absolute;
  left: 12px;
  color: #4a90e2;
}

.hashtag-input {
  width: 100%;
  padding: 12px 12px 12px 35px;
  border: 2px solid #e1e3e8;
  border-radius: 12px;
  font-size: 15px;
}

.visibility-selector {
  display: flex;
  gap: 15px;
}

.visibility-option {
  flex: 1;
  cursor: pointer;
}

.visibility-option input[type="radio"] {
  display: none;
}

.visibility-text {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 2px solid #e1e3e8;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.visibility-option input[type="radio"]:checked + .visibility-text {
  background: #4a90e2;
  color: white;
  border-color: #4a90e2;
}

.submit-btn {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (max-width: 768px) {
  .post-create-layout {
    grid-template-columns: 1fr;
  }
  
  .left-section {
    border-right: none;
    padding-right: 0;
    border-bottom: 1px solid #eee;
    padding-bottom: 40px;
  }
}

.hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
  opacity: 0;
}
</style>
