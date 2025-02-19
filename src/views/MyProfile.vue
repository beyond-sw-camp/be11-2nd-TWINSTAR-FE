<template>
  <div class="profile-container">
    <!-- 프로필 헤더 섹션 -->
    <div class="profile-header">
      <div class="profile-image">
        <img :src="profileImg || '/default-profile.png'" alt="프로필 이미지">
      </div>
      <div class="profile-info">
        <h2>{{ nickName }}</h2>
        <div class="profile-stats">
          <div class="stat">
            <span class="count">{{ posts.length }}</span>
            <span class="label">게시물</span>
          </div>
          <div class="stat">
            <span class="count">{{ followerCount }}</span>
            <span class="label">팔로워</span>
          </div>
          <div class="stat">
            <span class="count">{{ followingCount }}</span>
            <span class="label">팔로잉</span>
          </div>
        </div>
        <p class="profile-text">{{ profileTxt }}</p>
      </div>
    </div>

    <!-- 게시물 그리드 -->
    <div class="posts-grid">
      <div v-for="post in posts" :key="post.id" class="post-item">
        <img :src="post.imageUrl" :alt="post.description">
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MyProfile',
  data() {
    return {
      id: null,
      nickName: '',
      profileImg: '',
      profileTxt: '',
      followerCount: 0,
      followingCount: 0,
      idVisibility: '',
      userStatus: '',
      posts: []
    }
  }
}
</script>

<style scoped>
.profile-container {
  max-width: 935px;
  margin: 0 auto;
  padding: 30px 20px;
}

.profile-header {
  display: flex;
  margin-bottom: 44px;
}

.profile-image {
  width: 150px;
  height: 150px;
  margin-right: 100px;
}

.profile-image img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.profile-info {
  flex: 1;
}

.profile-info h2 {
  font-size: 28px;
  margin-bottom: 20px;
}

.profile-stats {
  display: flex;
  gap: 40px;
  margin-bottom: 20px;
}

.stat {
  display: flex;
  gap: 5px;
}

.count {
  font-weight: 600;
}

.profile-text {
  font-size: 16px;
  line-height: 1.5;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

.post-item {
  aspect-ratio: 1;
  overflow: hidden;
}

.post-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
