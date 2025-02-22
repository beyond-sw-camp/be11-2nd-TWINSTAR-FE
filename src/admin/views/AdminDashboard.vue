<template>
    <div class="admin-dashboard">
        <h1>관리자 대시보드</h1>
        <div class="dashboard-stats">
            <div class="stat-card">
                <h3>전체 사용자</h3>
                <p>{{ totalUsers }}</p>
            </div>
            <div class="stat-card">
                <h3>전체 게시물</h3>
                <p>{{ totalPosts }}</p>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'AdminDashboard',
    data() {
        return {
            totalUsers: 0,
            totalPosts: 0
        }
    },
    async created() {
        // API 호출로 데이터를 가져오는 로직 구현
    }
}
</script>
