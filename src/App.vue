<template>
<v-app>
  <!-- 관리자 페이지 레이아웃 -->
  <div v-if="isAdminPage" class="admin-layout">
    <AdminSidebar @sidebar-toggle="handleSidebarToggle" />
    <div class="admin-content" :class="{ 'content-collapsed': isSidebarCollapsed }">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </div>
  </div>
  
  <!-- 일반 페이지 레이아웃 -->
  <template v-else>
    <HeaderComponent v-if="!isAuthPage" :class="{ 'header-high-priority': !isAuthPage }" />
    <v-main class="main-content">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </v-main>
  </template>
</v-app>
</template>

<script>
import HeaderComponent from './components/HeaderComponent.vue'
import AdminSidebar from './admin/components/AdminSidebar.vue'

export default {
  components: {
    HeaderComponent,
    AdminSidebar
  },
  data() {
    return {
      isSidebarCollapsed: false
    }
  },
  computed: {
    isAuthPage() {
      return ['/login', '/signup', '/register'].includes(this.$route.path)
    },
    isAdminPage() {
      return this.$route.path.startsWith('/admin');
    }
  },
  methods: {
    handleSidebarToggle(isCollapsed) {
      this.isSidebarCollapsed = isCollapsed;
    }
  }
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.admin-content {
  flex: 1;
  padding: 20px;
  margin-left: 250px;
  background-color: #f5f5f5;
  min-height: 100vh;
  transition: all 0.3s ease;
}

.admin-content.content-collapsed {
  margin-left: 60px;
}

.admin-sidebar {
  width: 250px;
  background-color: #fff;
  border-right: 1px solid #e0e0e0;
}
</style>

<style>
#app {
  position: relative;
  width: 100%;
  height: 100vh;
}

.view-container {
  position: relative;
  width: 100%;
  height: 100%;
  margin-left: v-bind('isAuthPage ? "0" : "240px"');
  transition: margin-left 0.3s ease;
}

/* 헤더가 축소되었을 때 view-container 마진 조정 */
.header-collapsed .view-container {
  margin-left: 72px;
}

/* 인증 페이지일 때는 최상위 z-index */
.auth-page {
  z-index: 9999;
  position: relative;
}

/* 일반 페이지에서는 헤더가 최상위 */
.header-high-priority {
  z-index: 9999 !important;
}

/* 인증 페이지에서는 헤더가 낮은 우선순위 */
.auth-page ~ header {
  z-index: 1 !important;
}

/* 모달과 사이드바를 위한 전역 스타일 */
.modal-overlay {
  z-index: 10000;
}

.search-sidebar,
.notification-sidebar {
  z-index: 9998;
}

/* v-main의 기본 padding 제거 */
.main-content {
  padding-top: 0 !important;
}

/* HeaderComponent가 있을 때만 여백 추가 */
.v-main:has(+ .header-component) {
  padding-top: 60px !important;
}
</style>
