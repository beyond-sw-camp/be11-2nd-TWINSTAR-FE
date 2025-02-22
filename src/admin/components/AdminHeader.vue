<template>
    <div class="admin-layout">
        <AdminSidebar />
        <div class="admin-content">
            <AdminHeader />
            <router-view />
        </div>
    </div>
</template>

<script>
import AdminSidebar from './AdminSidebar.vue';
import AdminHeader from './AdminHeader.vue';

export default {
    components: {
        AdminSidebar,
        AdminHeader
    }
}
</script>

<style scoped>
.admin-layout {
    display: flex;
    height: 100vh;
}

.admin-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background-color: #f5f5f5;
}
</style>

