<template>
  <div class="header-container">
    <div class="logo">
      <router-link to="/">
        <img src="/logo.png" alt="Twinstar Logo" />
      </router-link>
    </div>
    
    <nav class="nav-menu">
      <router-link to="/" class="nav-item">
        <i class="fas fa-home"></i>
        <span>홈</span>
      </router-link>
      
      <router-link to="/search" class="nav-item">
        <i class="fas fa-search"></i>
        <span>검색</span>
      </router-link>
      
      <router-link to="/alarm" class="nav-item">
        <i class="fas fa-bell"></i>
        <span>알림</span>
      </router-link>
      
      <router-link to="/chat" class="nav-item">
        <i class="fas fa-envelope"></i>
        <span>메시지</span>
      </router-link>
      
      <router-link to="/post/create" class="nav-item">
        <i class="fas fa-image"></i>
        <span>게시물</span>
      </router-link>
    </nav>

    <div class="profile-section">
      <router-link to="user/myProfile" class="nav-item">
        <i class="fas fa-user"></i>
        <span>내 프로필</span>
      </router-link>
      
      <div class="dropdown">
        <button class="more-btn nav-item" @click="toggleDropdown">
          <i class="fas fa-bars"></i>
          <span>더 보기</span>
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
  </div>
</template>

<script>
import { jwtDecode } from 'jwt-decode';

export default {
  name: 'HeaderComponent',
  data() {
    return {
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
        }
  }
}
</script>

<style scoped>
.header-container {
  width: 220px;
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
</style>
