<template>
    <div class="admin-sidebar" :class="{ 'collapsed': isCollapsed }">
        <div class="sidebar-toggle" @click="toggleSidebar">
            <i :class="isCollapsed ? 'mdi mdi-menu' : 'mdi mdi-menu-open'"></i>
        </div>
        <div class="sidebar-header">
            <h2>{{ isCollapsed ? 'TS' : 'TwinStar Admin' }}</h2>
        </div>
        <nav class="sidebar-nav">
            <router-link to="/admin/users" class="nav-item">
                <i class="mdi mdi-account-group"></i>
                <span v-if="!isCollapsed">유저 관리</span>
            </router-link>
            <router-link to="/admin/reports" class="nav-item">
                <i class="mdi mdi-flag"></i>
                <span v-if="!isCollapsed">신고 관리</span>
            </router-link>
            <div class="nav-item" @click="handleLogout">
                <i class="mdi mdi-logout"></i>
                <span v-if="!isCollapsed">로그아웃</span>
            </div>
        </nav>
    </div>
</template>

<script>
export default {
    name: 'AdminSidebar',
    data() {
        return {
            isCollapsed: false
        }
    },
    methods: {
        toggleSidebar() {
            this.isCollapsed = !this.isCollapsed;
            // 이벤트를 발생시켜 App.vue에 알림
            this.$emit('sidebar-toggle', this.isCollapsed);
        },
        handleLogout() {
            localStorage.clear();
            window.location.href = '/user/login';
        }
    }
}
</script>

<style scoped>
.admin-sidebar {
    width: 250px;
    height: 100vh;
    background-color: white;
    border-right: 1px solid #e0e0e0;
    padding: 20px 0;
    position: fixed;
    transition: all 0.3s ease;
}

.admin-sidebar.collapsed {
    width: 60px;
}

.sidebar-toggle {
    position: absolute;
    right: -12px;
    top: 20px;
    width: 24px;
    height: 24px;
    background-color: white;
    border: 1px solid #e0e0e0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1000;
}

.sidebar-header {
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 20px;
    text-align: center;
}

.sidebar-header h2 {
    color: #333;
    font-size: 1.5rem;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.sidebar-nav {
    display: flex;
    flex-direction: column;
}

.nav-item {
    display: flex;
    align-items: center;
    padding: 15px 20px;
    color: #666;
    text-decoration: none;
    transition: all 0.3s ease;
    cursor: pointer;
}

.nav-item i {
    margin-right: 15px;
    font-size: 20px;
}

.collapsed .nav-item {
    padding: 15px;
    justify-content: center;
}

.collapsed .nav-item i {
    margin-right: 0;
}

.nav-item:hover {
    background-color: #f5f5f5;
    color: #333;
}

.router-link-active {
    background-color: #f0f0f0;
    color: #333;
}
</style>
