<template>
    <div class="user-management">
        <h1>유저 관리</h1>
        
        <!-- 검색창 수정 -->
        <div class="search-container">
            <div class="search-wrapper">
                <i class="fas fa-search search-icon"></i>
                <input 
                    type="text"
                    v-model="searchParams.nickName"
                    placeholder="닉네임으로 검색"
                    @input="handleSearch"
                    class="search-input"
                />
                <button 
                    v-if="searchParams.nickName" 
                    @click="clearSearch" 
                    class="clear-button"
                >
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>유저id</th>
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
                        <td>
                            <a 
                                @click="viewUserDetail(user.id)" 
                                class="user-id-link"
                            >
                                {{ user.id }}
                            </a>
                        </td>
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

        <!-- 유저 상세 정보 모달 -->
        <div v-if="showDetailModal" class="modal-overlay">
            <div class="modal-content">
                <h3>유저 상세 정보</h3>
                <div v-if="userDetail" class="user-detail">
                    <div class="detail-row">
                        <span class="label">유저 ID:</span>
                        <span>{{ userDetail.id }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">닉네임:</span>
                        <span>{{ userDetail.nickName }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">계정 상태:</span>
                        <span>{{ userDetail.userStatus }}</span>
                    </div>
                    <div class="detail-row" v-if="userDetail.banCloseTime">
                        <span class="label">정지 해제 일자:</span>
                        <span>{{ formatDateTime(userDetail.banCloseTime) }}</span>
                    </div>
                </div>
                <div class="modal-actions">
                    <button @click="closeDetailModal" class="close-button">닫기</button>
                </div>
            </div>
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
            pageSize: 10,
            showDetailModal: false,
            userDetail: null,
            searchTimeout: null
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
                const params = {
                    page: this.currentPage,
                    size: this.pageSize,
                    sort: 'id,DESC'
                };

                if (this.searchParams.nickName) {
                    params.nickName = this.searchParams.nickName;
                }

                const response = await axios.get(
                    `${process.env.VUE_APP_API_BASE_URL}/user/admin/list/search`,
                    { params }
                );
                
                if (response.data && response.data.result) {
                    const pageData = response.data.result;
                    this.users = pageData.content;
                    this.totalPages = pageData.totalPages;
                    this.currentPage = pageData.number;
                }
                
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
        async viewUserDetail(userId) {
            try {
                const response = await axios.get(
                    `${process.env.VUE_APP_API_BASE_URL}/user/admin/detail/${userId}`
                );
                
                if (response.data && response.data.result) {
                    this.userDetail = response.data.result;
                    this.showDetailModal = true;
                }
            } catch (error) {
                console.error('유저 상세 정보 로딩 실패:', error);
                alert('유저 상세 정보를 불러오는데 실패했습니다.');
            }
        },
        closeDetailModal() {
            this.showDetailModal = false;
            this.userDetail = null;
        },
        handleSearch() {
            // 디바운스 처리
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            this.searchTimeout = setTimeout(() => {
                this.loadUsers();
            }, 300);
        },
        clearSearch() {
            this.searchParams.nickName = '';
            this.loadUsers();
        }
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

.search-container {
    margin: 20px 0;
    display: flex;
    justify-content: flex-start;
    width: 100%;
}

.search-wrapper {
    position: relative;
    width: 100%;
    max-width: 400px;
    background: #efefef;
    border-radius: 8px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    transition: all 0.3s ease;
    height: 44px;
}

.search-wrapper:focus-within {
    background: #e0e0e0;
}

.search-icon {
    color: #8e8e8e;
    font-size: 14px;
    margin-right: 12px;
}

.search-input {
    width: 100%;
    height: 40px;
    background: transparent;
    border: none;
    outline: none;
    font-size: 14px;
    color: #262626;
    padding: 0;
}

.search-input::placeholder {
    color: #8e8e8e;
}

.clear-button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: #8e8e8e;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
}

.clear-button:hover {
    color: #262626;
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

.user-id-link {
    color: #0d6efd;
    cursor: pointer;
    text-decoration: underline;
}

.user-id-link:hover {
    color: #0a58ca;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
}

.user-detail {
    margin: 20px 0;
}

.detail-row {
    margin: 10px 0;
    display: flex;
    gap: 10px;
}

.label {
    font-weight: bold;
    min-width: 120px;
}

.modal-actions {
    margin-top: 20px;
    text-align: right;
}

.close-button {
    padding: 8px 16px;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.close-button:hover {
    background-color: #5c636a;
}
</style>