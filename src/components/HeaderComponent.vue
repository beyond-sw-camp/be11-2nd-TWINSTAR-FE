<template>
  <div class="header-container">
    <div class="top-section">
      <div class="logo">
        <router-link to="/">
          <img src="/logo.png" alt="Twinstar Logo" />
        </router-link>
      </div>
      
      <nav class="nav-menu">
        <a href="/" class="nav-item">
          <i class="fas fa-home"></i>
          <span>홈</span>
        </a>
        
        <div class="nav-item" @click="toggleSearch">
          <i class="fas fa-search"></i>
          <span>검색</span>
        </div>
        
        <div class="nav-item" @click="toggleNotification">
          <i class="fas fa-bell"></i>
          <span>알림</span>
        </div>
        
        <div class="nav-item" @click="viewMessagePage">
          <i class="fas fa-envelope"></i>
          <span>메시지</span>
        </div>
        
        <div class="nav-item" @click="goToPostCreate">
          <i class="fas fa-image"></i>
          <span>게시물</span>
        </div>

        <div class="nav-item" @click="viewMyProfile">
          <i class="fas fa-user"></i>
          <span>프로필</span>
        </div>
      </nav>
    </div>

    <div class="bottom-section">
      <div class="nav-item" @click="$router.push('/settings')">
        <i class="fas fa-cog"></i>
        <span>설정</span>
      </div>
      <div class="nav-item" @click="doLogout">
        <i class="fas fa-sign-out-alt"></i>
        <span>로그아웃</span>
      </div>
    </div>

    <div v-if="isSearchOpen" class="search-sidebar">
      <div class="search-header">
        <h3 class="search-title">검색</h3>
        <div class="search-input-container">
          <i class="fas fa-search search-icon"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            @input="handleSearch"
            placeholder="검색"
            class="search-input"
          >
        </div>
      </div>
      
      <div class="search-results" v-if="searchResults.length > 0">
        <div 
          v-for="user in searchResults" 
          :key="user.id" 
          class="user-item"
          @click="selectSearchResult(user)"
        >
          <img 
            :src="user.profileImg || '/images/default-profile.png'" 
            :alt="user.nickName"
            class="user-avatar"
            @error="handleImageError"
          >
          <span class="user-nickname">{{ user.nickName }}</span>
        </div>
      </div>
      <div v-else-if="!searchQuery" class="recent-searches">
        <div class="recent-searches-header">
          <h4>최근 검색</h4>
          <button 
            v-if="recentSearches.length > 0" 
            @click="clearRecentSearches" 
            class="clear-button"
          >
            모두 지우기
          </button>
        </div>
        <div v-if="recentSearches.length > 0" class="recent-searches-list">
          <div 
            v-for="(search, index) in recentSearches" 
            :key="index" 
            class="recent-search-item"
          >
            <div class="search-item-left" @click="goToUserProfile(search.id)">
              <img 
                :src="search.profileImg || '/images/default-profile.png'" 
                :alt="search.nickName"
                class="user-avatar"
                @error="handleImageError"
              >
              <div class="search-item-info">
                <span class="user-nickname">{{ search.nickName }}</span>
                <span class="search-time">{{ formatSearchTime(search.timestamp) }}</span>
              </div>
            </div>
            <button 
              @click="removeRecentSearch(index)" 
              class="remove-button"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div v-else class="no-recent-searches">
          최근 검색 기록이 없습니다
        </div>
      </div>
      <div v-else-if="searchQuery" class="no-results">
        검색 결과가 없습니다.
      </div>
    </div>

    <div v-if="showNotification" class="notification-sidebar">
      <v-card flat class="h-100">
        <v-card-title class="text-h6 py-4">알림</v-card-title>
        
        <v-card-text class="px-4">
          <v-list>
            <v-list-item
              v-for="notification in notifications"
              :key="notification.id"
              class="notification-item mb-2"
              @click="handleNotificationClick(notification)"
            >
              <template v-slot:prepend>
                <v-avatar size="40">
                  <v-img :src="notification.profileImage || '/images/default-profile.png'" />
                </v-avatar>
              </template>
              <v-list-item-title class="text-body-2">{{ notification.content }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">{{ formatTime(notification.createdTime) }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </div>

    <div v-if="showMessages" class="message-sidebar">
      <v-card flat class="h-100">
        <v-card-title class="text-h6 py-4">메시지</v-card-title>
        <v-card-text class="px-4">
          <ChatView />
        </v-card-text>
      </v-card>
    </div>
  </div>


</template>

<script>
import { jwtDecode } from 'jwt-decode';
import ChatView from '@/views/ChatView.vue'
import axios from 'axios';
import { EventSourcePolyfill } from 'event-source-polyfill';

export default {
  name: 'HeaderComponent',
  components: {
    ChatView,
  },
  data() {
    return {
      showSearchBar: false,
      showNotification: false,
      showMessages: false,
      searchQuery: '',
      isSearching: false,
      searchResults: {
        users: [],
        hashtags: []
      },
      recentSearches: [],
      menuItems: [
        { icon: 'mdi-home', text: '홈', route: '/' },
        { icon: 'mdi-magnify', text: '검색', isToggle: true },
        { icon: 'mdi-compass', text: '탐색', route: '/explore' },
        { icon: 'mdi-movie-play', text: '릴스', route: '/reels' },
        { icon: 'mdi-message-outline', text: '메시지', isToggle: true },
        { icon: 'mdi-heart-outline', text: '알림', isToggle: true },
      ],
      isDropdownOpen: false,
      userRole:null,
      isLogin:false,
      isSearchOpen: false,
      searchTimeout: null,
      maxRecentSearches: 20, // 최대 저장 개수
      userId: null,
      profileImage: null,
      sse: null,
      notifications: [],
      page: 0,
      size: 20,
    }
  },
  created() {
    const token = localStorage.getItem("token")
    if(token) {
      const payload = jwtDecode(token)
      this.userRole = payload.role
      this.isLogin = true
      this.userId = payload.sub
      this.loadProfileImage()
      this.sseConnect()
      this.requestNotificationPermission();
    }
  },
  methods: {
    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen
    },
    doLogout() {
            localStorage.clear()
            window.location.href='/'
        },
    handleSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(async () => {
        if (this.searchQuery.trim()) {
          try {
            const response = await axios.get(
              `${process.env.VUE_APP_API_BASE_URL}/user/list?size=10&sort=id,desc`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
            
            // 검색어와 일치하는 닉네임만 필터링
            this.searchResults = response.data.result.content.filter(user => 
              user.nickName.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
          } catch (error) {
            console.error('사용자 검색 실패:', error);
          }
        } else {
          this.searchResults = [];
        }
      }, 300);
    },

    goToUserProfile(userId) {
      this.$router.push(`/profile/${userId}`);
      this.isSearchOpen = false;
    },

    handleImageError(e) {
      e.target.src = '/images/default-profile.png';
    },

    handleMenuClick(item) {
      if (item.isToggle) {
        event.preventDefault()
        if (item.text === '검색') {
          this.toggleSearch()
          this.closeOtherSidebars('search')
        } else if (item.text === '알림') {
          this.toggleNotification()
          this.closeOtherSidebars('notification')
        } else if (item.text === '메시지') {
          this.toggleMessages()
          this.closeOtherSidebars('messages')
        }
      }
    },

    closeOtherSidebars(current) {
      if (current !== 'search') this.showSearchBar = false
      if (current !== 'notification') this.showNotification = false
      
      // 다른 사이드바가 모두 닫혔는지 확인
      if (!this.showSearchBar && !this.showNotification && !this.showMessages) {
        this.isSearchOpen = false
      }
    },

    toggleSearch() {
      this.isSearchOpen = !this.isSearchOpen
      this.showNotification = false
      this.showMessages = false
    },

    toggleNotification() {
      this.showNotification = !this.showNotification
      this.isSearchOpen = false
      this.showMessages = false
    },

    // 사용자 클릭 처리
    handleUserClick(user) {
      this.addToRecent(user)
      // 라우터가 설정되어 있지 않은 경우를 대비한 에러 처리
      try {
        this.$router.push(`/profile/${user.username}`)
      } catch (error) {
        console.log('프로필로 이동:', user.username)
      }
      this.toggleSearch()
    },

    // 해시태그 클릭 처리
    handleHashtagClick(tag) {
      try {
        this.$router.push(`/hashtag/${tag.name}`)
      } catch (error) {
        console.log('해시태그로 이동:', tag.name)
      }
      this.toggleSearch()
    },

    // 최근 검색어 관리
    addToRecent(item) {
      if (!item || !item.id) return
      
      const exists = this.recentSearches.find(recent => recent.id === item.id)
      if (!exists) {
        this.recentSearches.unshift(item)
        if (this.recentSearches.length > 10) {
          this.recentSearches.pop()
        }
        try {
          localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches))
        } catch (error) {
          console.error('최근 검색어 저장 실패:', error)
        }
      }
    },

    removeFromRecent(item) {
      if (!item || !item.id) return
      
      this.recentSearches = this.recentSearches.filter(recent => recent.id !== item.id)
      try {
        localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches))
      } catch (error) {
        console.error('최근 검색어 삭제 실패:', error)
      }
    },

    clearRecentSearches() {
      this.recentSearches = []
      try {
        localStorage.removeItem('recentSearches')
      } catch (error) {
        console.error('최근 검색어 전체 삭제 실패:', error)
      }
    },
    viewMessagePage() {
      this.$router.push('/chat')
    },
    selectSearchResult(user) {
      this.addToRecentSearches({
        id: user.id,
        nickName: user.nickName,
        profileImg: user.profileImg,
        timestamp: new Date().getTime()
      });
      this.goToUserProfile(user.id);
    },
    addToRecentSearches(search) {
      // 이미 존재하는 검색 결과 제거
      this.recentSearches = this.recentSearches.filter(item => item.id !== search.id);
      
      // 새 검색 결과를 배열 앞에 추가
      this.recentSearches.unshift(search);
      
      // 최대 개수 유지
      if (this.recentSearches.length > this.maxRecentSearches) {
        this.recentSearches.pop();
      }
      
      // localStorage에 저장
      localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
    },
    removeRecentSearch(index) {
      this.recentSearches.splice(index, 1);
      localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
    },
    formatSearchTime(timestamp) {
      const now = new Date().getTime();
      const diff = now - timestamp;
      
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (minutes < 60) return `${minutes}분 전`;
      if (hours < 24) return `${hours}시간 전`;
      return `${days}일 전`;
    },
    async loadProfileImage() {
      try {
        const userId = parseInt(this.userId);
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/user/detail/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        )
        if (response.data && response.data.result) {
          this.profileImage = response.data.result.profileImg;
        }
      } catch (error) {
        console.error('프로필 이미지 로드 실패:', error);
      }
    },
    viewMyProfile() {
      if (this.userId) {
        this.$router.push(`/profile/${this.userId}`);
      }
    },
    closeAllSidebars() {
      this.showNotification = false;
      this.isSearchOpen = false;
    },
    sseConnect() {
      const token = localStorage.getItem("token")
      const options = {
        heartbeatTimeout: 60000,
        headers: {Authorization: `Bearer ${token}`}
      };
      if (this.sse) {
        this.sse.close();
        console.log("기존 SSE 연결 닫음");
      }
      this.sse = new EventSourcePolyfill(`${process.env.VUE_APP_API_BASE_URL}/alarm/subscribe`, options)
      
      this.sse.addEventListener('connect', (event) => {
        console.log(event.data)
      })
      
      this.sse.addEventListener('alarm', (event) => {
        console.log(event.data)
        if (Notification.permission === "granted") {
          const data = JSON.parse(event.data);
          new Notification("새 알림", {
            body: data.content,
            icon: "https://twinstar.s3.ap-northeast-2.amazonaws.com/twinstarOnlyLog.png",
          }).onclick = () => {
            window.location.href = data.url;
          }
        }
      })
    },
    requestNotificationPermission() {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          console.log("알림 권한:", permission);
        });
      }
    },
    goToPostCreate() {
      this.$router.push('/post/create')
    },
    async loadNotifications() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL}/alarm/list`,
          {
            params: {
              page: this.page,
              size: this.size
            },
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        console.log(response.data.result.content)
        this.notifications = response.data.result.content;
      } catch (error) {
        console.error('알림 로드 실패:', error);
      }
    },
    formatTime(timeArray) {
      if (!Array.isArray(timeArray)) return '시간 정보 없음';
      
      // 배열에서 년,월,일,시,분,초 추출
      const [year, month, day, hour, minute, second] = timeArray;
      
      // JavaScript Date 객체 생성 (월은 0부터 시작하므로 -1)
      const date = new Date(year, month - 1, day, hour, minute, second);
      const now = new Date();
      const diff = now - date;
      
      // 시간 차이 계산
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      // 1일 이상 차이나면 "2024.02.27" 형식으로 표시
      if (days > 0) {
        return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
      }
      // 1시간 이상 차이나면 "3시간 전"
      if (hours > 0) {
        return `${hours}시간 전`;
      }
      // 1분 이상 차이나면 "30분 전"
      if (minutes > 0) {
        return `${minutes}분 전`;
      }
      // 1분 미만이면 "방금 전"
      return '방금 전';
    },
    handleNotificationClick(notification) {
      // 알림 클릭 시 해당 URL로 이동
      if (notification.url) {
        window.location.href = notification.url;
      }
      this.showNotification = false;
    },
  },
  
  mounted() {
    try {
      const saved = localStorage.getItem('recentSearches')
      if (saved) {
        this.recentSearches = JSON.parse(saved)
      }
    } catch (error) {
      console.error('최근 검색어 불러오기 실패:', error)
      this.recentSearches = []
    }
  },

  beforeUnmount() {
    if (this.sse) {
      this.sse.close();
      console.log("SSE 연결 닫음 (컴포넌트 언마운트)");
    }
  },
  watch: {
    showNotification(newVal) {
      if (newVal) {
        this.loadNotifications();
      }
    }
  }
}
</script>

<style scoped>
.header-container {
  width: 240px;
  height: 100vh;
  background-color: #ffffff;
  border-right: 1px solid #e0e0e0;
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
}

.top-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.bottom-section {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.logo {
  padding: 0 16px;
  margin-bottom: 30px;
  display: flex;
  justify-content: flex-start;
  margin-left: 10px;  /* 로고 왼쪽 마진 추가 */
}

.collapsed .logo {
  padding: 0;
  justify-content: center;  /* 가운데 정렬 */
  margin-left: 4px;  /* 미세 조정 */
  margin-right: 4px;
}

.logo img {
  height: 40px;  /* 로고 높이 증가 (기존보다 더 크게) */
  width: auto;   /* 비율 유지를 위해 width는 auto */
}

.collapsed .logo img {
  height: 40px;
  padding: 4px;  /* 로고 주변 여백 추가 */
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: 'Montserrat', 'Noto Sans KR', sans-serif;
  font-weight: 600;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  text-decoration: none;
  gap: 12px;
  cursor: pointer;
  margin-top: 10px;    /* 위쪽 마진 추가 */
  margin-left: 10px;   /* 왼쪽 마진 추가 */
}

.nav-item:hover {
  background-color: #f8f9fa;
  border-radius: 6px;
}

.nav-item i {
  font-size: 20px;
  width: 24px;
  background: linear-gradient(90deg, #4776E6, #8E54E9);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-item span {
  font-size: 1.1rem;  /* 살짝 작게 */
  color: #444444;
  font-family: 'Montserrat', 'Noto Sans KR', sans-serif;
  font-weight: 500; 
}

.more-btn {
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  left: 0;
  bottom: 100%;
  width: 240px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  padding: 8px 0;
  margin-bottom: 8px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  text-decoration: none;
  color: #444444;
  gap: 12px;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 8px 0;
}

.search-sidebar, .notification-sidebar, .message-sidebar {
  position: fixed;
  right: 0;
  width: 380px;
  top: 0;
  height: 100vh;
  background: white;
  border-left: 1px solid #e0e0e0;
  z-index: 1002;
  overflow-y: auto;
}

.search-header {
  padding: 8px 16px 16px;
  border-bottom: 1px solid #dbdbdb;
  background: white;
}

.search-title {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 16px;
  padding: 12px 8px;
}

.search-input-container {
  position: relative;
  padding: 0;
}

.search-input {
  width: 100%;
  padding: 12px 40px;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  font-size: 14px;
  background-color: #efefef;
}

.search-input:focus {
  outline: none;
  background-color: #efefef;
}

.search-icon {
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  color: #8e8e8e;
}

.search-results {
  padding: 16px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.user-item:hover {
  background-color: #f8f9fa;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
}

.user-nickname {
  font-weight: 500;
  color: #262626;
}

.no-results {
  padding: 20px;
  text-align: center;
  color: #8e8e8e;
}

.notification-item {
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f8f8f8;
}

.notification-sidebar {
  position: fixed;
  right: 0;
  width: 380px;
  top: 0;
  height: 100vh;
  background: white;
  border-left: 1px solid #e0e0e0;
  z-index: 1002;
  overflow-y: auto;
}

.recent-searches {
  padding: 16px;
}

.recent-searches-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.recent-searches-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.clear-button {
  color: #0095f6;
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
}

.recent-search-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
}

.search-item-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.search-item-info {
  display: flex;
  flex-direction: column;
  margin-left: 12px;
}

.search-time {
  font-size: 12px;
  color: #8e8e8e;
}

.remove-button {
  background: none;
  border: none;
  color: #8e8e8e;
  cursor: pointer;
  padding: 8px;
}

.remove-button:hover {
  color: #262626;
}

.no-recent-searches {
  text-align: center;
  color: #8e8e8e;
  padding: 20px 0;
}

.profile-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  margin-right: 20px;
}

.profile-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

/* 모바일 반응형 */
@media screen and (max-width: 768px) {
  .search-sidebar, .notification-sidebar, .message-sidebar {
    width: 100%;
    right: 0;
    top: 0;
  }
}

.bottom-section .nav-item span {
  font-size: 1.15rem;  /* 살짝 작게 */
  color: #444444;
  font-family: 'Montserrat', 'Noto Sans KR', sans-serif;
  font-weight: 500;    /* 살짝 얇게 */
}

.bottom-section .nav-item i {
  font-size: 18px;
  width: 24px;
  background: linear-gradient(90deg, #4776E6, #8E54E9);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0.9;
}
</style>