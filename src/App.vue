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
    <HeaderComponent v-if="!isLoginPage && !isCreatePage"/> 
    <v-main>
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
    isLoginPage() {
      return this.$route.path === "/user/login";
    },
    isCreatePage(){
      return this.$route.path === "/user/create";
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

<!-- <style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style> -->
