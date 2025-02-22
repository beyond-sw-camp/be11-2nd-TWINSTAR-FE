<template>
    <div class="user-management">
        <h1>유저 관리</h1>
        
        <!-- 검색 폼 -->
        <div class="search-form">
            <input 
                v-model="searchParams.nickName" 
                placeholder="닉네임으로 검색"
                @keyup.enter="loadUsers"
            >
            <button @click="loadUsers">검색</button>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>유저 아이디</th>
                        <th>이메일</th>
                        <th>닉네임</th>
                        <th>성별</th>
                        <th>계정공개범위</th>
                        <th>계정상태</th>
                        <th>삭제여부</th>
                        <th>관리자여부</th>
                        <th>생성일자</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="user in users" :key="user.id">
                        <td>{{ user.id }}</td>
                        <td>{{ user.email }}</td>
                        <td>{{ user.nickName }}</td>
                        <td>{{ user.sex }}</td>
                        <td>{{ user.idVisibility }}</td>
                        <td>{{ user.userStatus }}</td>
                        <td>{{ user.delYn === 'Y' ? '삭제' : '미삭제' }}</td>
                        <td>{{ user.adminYn === 'ADMIN' ? '관리자' : '일반유저' }}</td>
                        <td>{{ formatDateTime(user.createdAt) }}</td>
                        <td class="action-buttons">
                            <button 
                                @click="toggleAdmin(user)"
                                :class="{'admin-active': user.adminYn === 'ADMIN'}"
                            >
                                {{ user.adminYn === 'ADMIN' ? '관리자 해제' : '관리자 지정' }}
                            </button>
                            <button 
                                @click="toggleBan(user)"
                                :class="{'ban-active': user.userStatus === 'BANNED'}"
                            >
                                {{ user.userStatus === 'ACTIVE' ? '정지' : '정지 해제' }}
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 페이지네이션 -->
        <div class="pagination">
            <button 
                :disabled="currentPage === 0" 
                @click="changePage(currentPage - 1)"
            >
                이전
            </button>
            <span>페이지 {{ currentPage + 1 }} / {{ totalPages }}</span>
            <button 
                :disabled="currentPage >= totalPages - 1" 
                @click="changePage(currentPage + 1)"
            >
                다음
            </button>
        </div>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    name: 'UserManagement',
    data() {
        return {
            users: [],
            currentPage: 0,
            totalPages: 0,
            searchParams: {
                nickName: ''
            },
            pageSize: 10
        }
    },
    methods: {
        formatDateTime(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        },
        async loadUsers() {
            try {
                const params = new URLSearchParams({
                    page: this.currentPage,
                    size: this.pageSize,
                    sort: 'id,DESC'
                });

                if (this.searchParams.nickName) {
                    params.append('nickName', this.searchParams.nickName);
                }

                const response = await axios.get(
                    `${process.env.VUE_APP_API_BASE_URL}/user/admin/user/list?${params.toString()}`
                );
                
                console.log('백엔드 응답 데이터:', response.data);
                
                // Page 객체에서 데이터 추출
                this.users = response.data.content;
                this.totalPages = response.data.totalPages;
                this.currentPage = response.data.number;
                
            } catch (error) {
                console.error('유저 목록 로딩 실패:', error);
                alert('유저 목록을 불러오는데 실패했습니다.');
            }
        },
        async toggleAdmin(user) {
            try {
                if (user.adminYn === 'ADMIN') {
                    // 관리자 권한 회수
                    await axios.post(`${process.env.VUE_APP_API_BASE_URL}/user/admin/revoke`, {
                        id: user.id
                    });
                    user.adminYn = 'USER';
                } else {
                    // 관리자 권한 부여
                    await axios.post(`${process.env.VUE_APP_API_BASE_URL}/user/admin/grant`, {
                        id: user.id
                    });
                    user.adminYn = 'ADMIN';
                }
                
                // 백엔드 응답 메시지를 그대로 사용하도록 수정 가능
                alert(`관리자 권한이 ${user.adminYn === 'ADMIN' ? '부여' : '해제'}되었습니다.`);
            } catch (error) {
                console.error('관리자 권한 변경 실패:', error);
                if (error.response?.data?.message) {
                    alert(error.response.data.message);
                } else {
                    alert('관리자 권한 변경에 실패했습니다.');
                }
            }
        },
        async toggleBan(user) {
            try {
                if (user.userStatus === 'ACTIVE') {
                    // 정지 처리
                    const days = prompt('정지 기간을 입력하세요 (일). 무기한 정지는 빈칸으로 두세요.');
                    if (days === null) return; // 취소 버튼 클릭 시
                    
                    const params = new URLSearchParams();
                    if (days !== '') {
                        params.append('days', days);
                    }
                    
                    await axios.post(
                        `${process.env.VUE_APP_API_BASE_URL}/user/admin/ban`,
                        params
                    );
                    
                    user.userStatus = 'BAN';
                    alert(days ? `사용자가 ${days}일 동안 정지되었습니다.` : '사용자가 무기한 정지되었습니다.');
                } else {
                    // 정지 해제 처리
                    await axios.post(
                        `${process.env.VUE_APP_API_BASE_URL}/user/${user.id}/unban`
                    );
                    
                    user.userStatus = 'ACTIVE';
                    alert('사용자 계정 정지가 해제되었습니다.');
                }
            } catch (error) {
                console.error('사용자 상태 변경 실패:', error);
                alert('사용자 상태 변경에 실패했습니다.');
            }
        },
        async changePage(newPage) {
            this.currentPage = newPage;
            await this.loadUsers();
        },
    },
    created() {
        this.loadUsers();
    }
};
</script>

<style scoped>
.user-management {
    padding: 20px;
    width: 100%;
}

.table-container {
    width: 100%;
    overflow-x: auto;
    margin-bottom: 20px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: #888 #f1f1f1;
}

/* Chrome, Safari, Edge 스크롤바 스타일링 */
.table-container::-webkit-scrollbar {
    height: 8px;
}

.table-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb:hover {
    background: #555;
}

table {
    width: 100%;
    min-width: 1200px;
    border-collapse: collapse;
    white-space: nowrap;
}

th, td {
    padding: 12px 15px;
    text-align: left;
    border: 1px solid #ddd;
}

th {
    background-color: #f4f4f4;
    position: sticky;
    top: 0;
    z-index: 1;
}

.search-form {
    margin-bottom: 20px;
}

.search-box {
    position: relative;
    width: 300px;
}

.search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    font-size: 20px;
}

.search-box input {
    width: 100%;
    padding: 12px 40px 12px 40px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.3s ease;
    background-color: white;
}

.search-box input:focus {
    outline: none;
    border-color: #4a90e2;
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.search-box input::placeholder {
    color: #999;
}

.clear-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 0;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.clear-btn:hover {
    color: #333;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    gap: 10px;
    align-items: center;
}

.action-buttons {
    white-space: nowrap;
}

.action-buttons button {
    margin: 0 5px;
    padding: 5px 10px;
    cursor: pointer;
}

/* 반응형 디자인 */
@media screen and (max-width: 768px) {
    .table-container {
        margin: 0 -20px;
    }
}

.ban-button {
    background-color: #dc3545;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
}

.unban-button {
    background-color: #28a745;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
}

.ban-button:hover {
    background-color: #c82333;
}

.unban-button:hover {
    background-color: #218838;
}
</style>