<template>
    <div>
        <h1>게시물 관리</h1>
        <table>
            <thead>
                <tr>
                    <th>게시물 ID</th>
                    <th>프로필</th>
                    <th>닉네임</th>
                    <th>내용</th>
                    <th>좋아요 수</th>
                    <th>댓글 수</th>
                    <th>생성 시간</th>
                    <th>관리</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="post in posts" :key="post.id">
                    <td>{{ post.id }}</td>
                    <td>
                        <img 
                            :src="post.profileImg" 
                            :alt="post.nickname"
                            class="profile-img"
                        >
                    </td>
                    <td>{{ post.nickname }}</td>
                    <td class="content-cell">
                        {{ post.content.length > 50 ? post.content.slice(0, 50) + '...' : post.content }}
                    </td>
                    <td>{{ post.likeCount }}</td>
                    <td>{{ post.commentCount }}</td>
                    <td>{{ formatDate(post.createdAt) }}</td>
                    <td>
                        <button 
                            @click="deletePost(post.id)"
                            class="delete-btn"
                        >
                            삭제
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    name: 'PostManagement',
    data() {
        return {
            posts: []
        }
    },
    methods: {
        async loadPosts() {
            try {
                const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/admin/posts`);
                this.posts = response.data;
            } catch (error) {
                console.error('게시물 목록 로딩 실패:', error);
                alert('게시물 목록을 불러오는데 실패했습니다.');
            }
        },
        formatDate(dateString) {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        },
        async deletePost(postId) {
            if (!confirm('정말로 이 게시물을 삭제하시겠습니까?')) return;
            
            try {
                await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/admin/posts/${postId}`);
                alert('게시물이 삭제되었습니다.');
                this.loadPosts(); // 목록 새로고침
            } catch (error) {
                console.error('게시물 삭제 실패:', error);
                alert('게시물 삭제에 실패했습니다.');
            }
        }
    },
    created() {
        this.loadPosts();
    }
}
</script>

<style scoped>
table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}

th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
}

th {
    background-color: #f4f4f4;
}

.profile-img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
}

.content-cell {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.delete-btn {
    background-color: #dc3545;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
}

.delete-btn:hover {
    background-color: #c82333;
}

h1 {
    margin-bottom: 20px;
}
</style>
