<template>
    <div class="report-management">
        <div class="search-section">
            <div class="search-container">
                <div class="filter-group">
                    <select v-model="searchParams.reportType" class="filter-select" @change="loadReports">
                        <option value="">전체 유형</option>
                        <option value="USER">사용자</option>
                        <option value="POST">게시글</option>
                        <option value="COMMENT">댓글</option>
                        <option value="CHAT">채팅</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>신고 ID</th>
                        <th>신고자 ID</th>
                        <th>신고대상 ID</th>
                        <th>신고 유형</th>
                        <th>대상 ID</th>
                        <th>신고 내용</th>
                        <th>신고일</th>
                        <th>작업</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="report in reports" :key="report.id">
                        <td>{{ report.id }}</td>
                        <td>{{ report.reporterId }}</td>
                        <td>{{ report.reportedId }}</td>
                        <td>{{ getReportTypeName(report.reportedType) }}</td>
                        <td>{{ report.typeId }}</td>
                        <td>{{ report.content }}</td>
                        <td>{{ formatDate(report.reportedTime) }}</td>
                        <td>
                            <button 
                                @click="handleReport(report)"
                                class="action-button"
                            >
                                처리하기
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
            <span>{{ currentPage + 1 }} / {{ totalPages }}</span>
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
    name: 'ReportManagement',
    data() {
        return {
            reports: [],
            currentPage: 0,
            totalPages: 0,
            searchParams: {
                reportType: '',
                reportedId: null
            },
            pageSize: 10
        }
    },
    methods: {
        async loadReports() {
            try {
                const params = {
                    page: this.currentPage,
                    size: this.pageSize,
                    sort: 'id,DESC',
                    ...this.searchParams
                }

                const response = await axios.get(
                    `${process.env.VUE_APP_API_BASE_URL}/reports/list`,
                    { params }
                );
                
                if (response.data && response.data.data) {
                    this.reports = response.data.data.content || [];
                    this.totalPages = response.data.data.totalPages || 0;
                    console.log('Reports data:', this.reports);
                }
            } catch (error) {
                console.error('신고 목록 로딩 실패:', error);
                alert('신고 목록을 불러오는데 실패했습니다.');
            }
        },

        getReportTypeName(type) {
            const types = {
                'USER': '사용자',
                'POST': '게시글',
                'COMMENT': '댓글',
                'CHAT': '채팅'
            };
            return types[type] || type;
        },

        getStatusClass(status) {
            return status === 'PENDING' ? 'status-pending' : 'status-complete';
        },

        formatDate(date) {
            return new Date(date).toLocaleString('ko-KR');
        },

        async handleReport(report) {
            const comment = prompt('처리 내용을 입력하세요:');
            if (comment === null) return;

            try {
                await axios.put(
                    `${process.env.VUE_APP_API_BASE_URL}/reports/${report.id}/process-delete`,
                    {
                        status: 'COMPLETE',
                        comment: comment
                    }
                );
                
                await this.loadReports();
                alert('신고가 처리되었습니다.');
            } catch (error) {
                console.error('신고 처리 실패:', error);
                alert('신고 처리에 실패했습니다.');
            }
        },

        async changePage(newPage) {
            this.currentPage = newPage;
            await this.loadReports();
        }
    },
    created() {
        this.loadReports();
    }
}
</script>

<style scoped>
.report-management {
    padding: 20px;
}

.search-section {
    margin-bottom: 20px;
}

.search-container {
    display: flex;
    gap: 10px;
}

.filter-group {
    display: flex;
    gap: 10px;
}

.filter-select {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    min-width: 150px;
}

.table-container {
    width: 100%;
    overflow-x: auto;
    margin-bottom: 20px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

table {
    width: 100%;
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
}

.status-pending {
    color: #dc3545;
    font-weight: bold;
}

.status-complete {
    color: #28a745;
    font-weight: bold;
}

.action-button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
}

.action-button:hover {
    background-color: #0056b3;
}

.pagination {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 20px;
}

.pagination button {
    padding: 8px 16px;
    border: 1px solid #ddd;
    background-color: white;
    cursor: pointer;
    border-radius: 4px;
}

.pagination button:disabled {
    background-color: #f4f4f4;
    cursor: not-allowed;
}

.pagination button:hover:not(:disabled) {
    background-color: #e9ecef;
}
</style>