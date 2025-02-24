<template>
  <div class="header-container" :class="{ 'collapsed': isCollapsed }">
    <div class="logo">
      <router-link to="/">
        <img src="/logo.png" alt="Twinstar Logo" />
      </router-link>
    </div>
    
    <nav class="nav-menu">
      <router-link to="/" class="nav-item">
        <i class="fas fa-home"></i>
        <span v-if="!isCollapsed">홈</span>
      </router-link>
      
      <div class="nav-item" @click="toggleSearch">
        <i class="fas fa-search"></i>
        <span v-if="!isCollapsed">검색</span>
      </div>
      
      <div class="nav-item" @click="toggleNotification">
        <i class="fas fa-bell"></i>
        <span v-if="!isCollapsed">알림</span>
      </div>
      
      <div class="nav-item" @click="viewMessagePage">
        <i class="fas fa-envelope"></i>
        <span v-if="!isCollapsed">메시지</span>
      </div>
      
      <router-link to="/post/create" class="nav-item">
        <i class="fas fa-image"></i>
        <span v-if="!isCollapsed">게시물</span>
      </router-link>
    </nav>

    <div class="profile-section">
      <router-link to="/myprofile" class="nav-item">
        <i class="fas fa-user"></i>
        <span v-if="!isCollapsed">내 프로필</span>
      </router-link>
      
      <div class="dropdown">
        <button class="more-btn nav-item" @click="toggleDropdown">
          <i class="fas fa-bars"></i>
          <span v-if="!isCollapsed">더 보기</span>
        </button>
        
        <div class="dropdown-menu" v-show="isDropdownOpen">
          <router-link to="/settings" class="dropdown-item">
            <i class="fas fa-cog"></i>
            <span>설정</span>
          </router-link>
          <router-link to="/display" class="dropdown-item">
            <i class="fas fa-moon"></i>
            <span>모드 전환</span>
          </router-link>
          <router-link to="/reports" class="dropdown-item">
            <i class="fas fa-flag"></i>
            <span>문제 신고</span>
          </router-link>
          <div class="dropdown-divider"></div>
          <router-link to="/logout" class="dropdown-item" @click="doLogout">
            <span>로그아웃</span>
          </router-link>
        </div>
      </div>
    </div>

    <div v-if="showSearchBar" class="search-sidebar" :class="{ 'collapsed-sidebar': isCollapsed }">
      <div class="search-header">
        <h3>검색</h3>
        <v-text-field
          v-model="searchQuery"
          placeholder="검색"
          prepend-inner-icon="fas fa-search"
          variant="outlined"
          density="compact"
        ></v-text-field>
      </div>
    </div>

    <div v-if="showNotification" class="notification-sidebar" :class="{ 'collapsed-sidebar': isCollapsed }">
      <v-card flat class="h-100">
        <v-card-title class="text-h6 py-4">알림</v-card-title>
        
        <v-card-text class="px-4">
          <v-list>
            <v-list-item
              v-for="(notification, index) in [
                { avatar: 'https://randomuser.me/api/portraits/men/1.jpg', text: '회원님의 게시물을 좋아합니다.', time: '1시간 전' },
                { avatar: 'https://randomuser.me/api/portraits/women/1.jpg', text: '회원님을 팔로우하기 시작했습니다.', time: '2시간 전' }
              ]"
              :key="index"
              class="notification-item mb-2"
            >
              <template v-slot:prepend>
                <v-avatar size="40">
                  <v-img :src="notification.avatar" />
                </v-avatar>
              </template>
              <v-list-item-title class="text-body-2">{{ notification.text }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">{{ notification.time }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </div>

    <div v-if="showMessages" class="message-sidebar" :class="{ 'collapsed-sidebar': isCollapsed }">
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

export default {
  name: 'HeaderComponent',
  components: {
    ChatView
  },
  data() {
    return {
      isCollapsed: false,
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
    }
  },
  created() {
        const token = localStorage.getItem("token")
        if(token) {
            const payload = jwtDecode(token)
            this.userRole = payload.role
            this.isLogin = true
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
    handleSearch: debounce(async function() {
      if (!this.searchQuery) {
        this.searchResults = { users: [], hashtags: [] }
        return
      }

      this.isSearching = true
      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        
        this.searchResults = {
          users: [
            { id: 1, username: '@user1', name: 'User One', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
            { id: 2, username: '@user2', name: 'User Two', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' }
          ],
          hashtags: [
            { id: 1, name: 'coding', posts: 100 },
            { id: 2, name: 'vue', posts: 200 }
          ]
        }
      } catch (error) {
        console.error('검색 중 오류 발생:', error)
        this.searchResults = { users: [], hashtags: [] }
      } finally {
        this.isSearching = false
      }
    }, 300),

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
        this.isCollapsed = false
      }
    },

    toggleSearch() {
      this.showSearchBar = !this.showSearchBar
      this.isCollapsed = this.showSearchBar
    },

    toggleNotification() {
      this.showNotification = !this.showNotification
      this.isCollapsed = this.showNotification
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
    // 이벤트 리스너가 있다면 제거
    if (this.handleSearch.cancel) {
      this.handleSearch.cancel()
    }
  }
}

// debounce 유틸리티 함수
function debounce(fn, delay) {
  let timeoutId
  const debouncedFn = function(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
  debouncedFn.cancel = () => clearTimeout(timeoutId)
  return debouncedFn
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
  transition: width 0.3s ease;
}

.header-container.collapsed {
  width: 72px;
}

.logo {
  padding: 0 16px;
  margin-bottom: 30px;
}

.logo img {
  height: 32px;
}

.nav-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  text-decoration: none;
  gap: 12px;
  cursor: pointer;
}

.collapsed .nav-item {
  justify-content: center;
  padding: 12px;
}

.nav-item:hover {
  background-color: #f8f9fa;
  border-radius: 6px;
  margin: 0 8px;
}

.nav-item i {
  font-size: 20px;
  width: 24px;
  color: #45C7FF;
}

.nav-item span {
  font-size: 15px;
  color: #444444;
}

.profile-section {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
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
  left: 240px;
  width: 400px;
  top: 0;
  height: 100vh;
  background: white;
  border-right: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.collapsed-sidebar {
  left: 72px;
}

.search-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
}

.notification-item {
  border-radius: 8px;
}

.notification-item:hover {
  background-color: #f8f8f8;
}
</style>
