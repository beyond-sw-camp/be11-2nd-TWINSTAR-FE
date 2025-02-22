<template>
    <div class="report-management">
        <h2 class="page-title">신고 관리</h2>
        
        <div class="search-section">
            <div class="search-container">
                <div class="filter-group">
                    <select v-model="searchParams.reportType" class="filter-select" @change="loadReports">
                        <option value="">전체 유형</option>
                        <option v-for="(name, type) in reportTypes" :key="type" :value="type">
                            {{ name }}
                        </option>
                    </select>
                    <select v-model="searchParams.status" class="filter-select" @change="loadReports">
                        <option value="">전체 상태</option>
                        <option value="PENDING">처리 대기</option>
                        <option value="COMPLETE">처리 완료</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>신고 ID</th>
                        <th>신고자</th>
                        <th>신고대상</th>
                        <th>신고 유형</th>
                        <th>신고 내용</th>
                        <th>신고일</th>
                        <th>상태</th>
                        <th>작업</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="report in reports" :key="report.id" :class="getStatusClass(report.reportStatus)">
                        <td>
                            <a 
                                @click="viewReportDetail(report.id)" 
                                class="report-id-link"
                            >
                                {{ report.id }}
                            </a>
                        </td>
                        <td>{{ report.reporterId }}</td>
                        <td>{{ report.reportedId }}</td>
                        <td>{{ reportTypes[report.reportedType] || report.reportedType }}</td>
                        <td class="content-cell">{{ report.content }}</td>
                        <td>{{ formatDate(report.reportedTime) }}</td>
                        <td>{{ getStatusName(report.reportStatus) }}</td>
                        <td>
                            <button 
                                @click="handleReport(report)"
                                class="action-button"
                                :disabled="report.reportStatus === 'COMPLETE'"
                            >
                                {{ report.reportStatus === 'COMPLETE' ? '처리완료' : '처리하기' }}
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="pagination">
            <button 
                :disabled="currentPage === 0" 
                @click="changePage(currentPage - 1)"
                class="page-button"
            >
                이전
            </button>
            <span class="page-info">{{ currentPage + 1 }} / {{ totalPages }}</span>
            <button 
                :disabled="currentPage >= totalPages - 1" 
                @click="changePage(currentPage + 1)"
                class="page-button"
            >
                다음
            </button>
        </div>

        <!-- 신고 상세 모달 -->
        <div v-if="showDetailModal" class="modal-overlay">
            <div class="modal-content">
                <h3>신고 상세 정보</h3>
                <div v-if="reportDetail" class="report-detail">
                    <div class="detail-row">
                        <span class="label">신고 ID:</span>
                        <span>{{ reportDetail.reportId }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">신고된 사용자 ID:</span>
                        <span>{{ reportDetail.reportedId }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">처리 상태:</span>
                        <span>{{ getStatusName(reportDetail.reportStatus) }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">관리자 코멘트:</span>
                        <span>{{ reportDetail.adminComment || '아직 처리되지 않았습니다.' }}</span>
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
    name: 'ReportManagement',
    data() {
        return {
            reports: [],
            currentPage: 0,
            totalPages: 0,
            searchParams: {
                reportType: '',
                status: '',
                reportedId: null
            },
            pageSize: 10,
            reportTypes: {
                'USER': '사용자',
                'POST': '게시글',
                'COMMENT': '댓글',
                'CHAT': '채팅'
            },
            showDetailModal: false,
            reportDetail: null
        }
    },
    methods: {
        async loadReports() {
            try {
                const params = {
                    page: this.currentPage,
                    size: this.pageSize,
                    sort: 'reportedTime,DESC',
                    reportType: this.searchParams.reportType || null,
                    reportStatus: this.searchParams.status || null
                }

                const response = await axios.get(
                    `${process.env.VUE_APP_API_BASE_URL}/reports/list`,
                    { params }
                );
                
                console.log('Response:', response.data);

                if (response.data && response.data.result) {
                    const pageData = response.data.result;
                    this.reports = pageData.content || [];
                    this.totalPages = pageData.totalPages || 0;
                    
                    console.log('Reports:', this.reports);
                }
            } catch (error) {
                console.error('신고 목록 로딩 실패:', error.response || error);
                alert('신고 목록을 불러오는데 실패했습니다.');
            }
        },

        getStatusName(status) {
            const statusMap = {
                'PENDING': '처리 대기',
                'COMPLETE': '처리 완료'
            };
            return statusMap[status] || status;
        },

        getStatusClass(status) {
            return {
                'status-pending': status === 'PENDING',
                'status-complete': status === 'COMPLETE'
            };
        },

        formatDate(date) {
            return new Date(date).toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        async handleReport(report) {
            const comment = prompt('처리 내용을 입력하세요:');
            if (comment === null) return;

            try {
                await axios.put(
                    `${process.env.VUE_APP_API_BASE_URL}/reports/${report.id}/process-delete`,
                    {
                        reportStatus: 'COMPLETE',
                        comment: comment
                    }
                );
                
                await this.loadReports();
                alert('신고가 처리되었습니다.');
            } catch (error) {
                console.error('신고 처리 실패:', error.response || error);
                alert('신고 처리에 실패했습니다.');
            }
        },

        async changePage(newPage) {
            this.currentPage = newPage;
            await this.loadReports();
        },

        getReportTypeName(type) {
            return this.reportTypes[type] || type;
        },

        async viewReportDetail(reportId) {
            try {
                const response = await axios.get(
                    `${process.env.VUE_APP_API_BASE_URL}/reports/detail/${reportId}`
                );
                
                if (response.data && response.data.result) {
                    this.reportDetail = response.data.result;
                    this.showDetailModal = true;
                }
            } catch (error) {
                console.error('신고 상세 정보 로딩 실패:', error.response || error);
                alert('신고 상세 정보를 불러오는데 실패했습니다.');
            }
        },

        closeDetailModal() {
            this.showDetailModal = false;
            this.reportDetail = null;
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
    max-width: 1200px;
    margin: 0 auto;
}

.page-title {
    margin-bottom: 20px;
    color: #333;
}

.search-section {
    margin-bottom: 20px;
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
}

.search-container {
    display: flex;
    gap: 15px;
}

.filter-group {
    display: flex;
    gap: 15px;
}

.filter-select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    min-width: 150px;
    background-color: white;
}

.table-container {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    overflow: hidden;
    margin-bottom: 20px;
}

table {
    width: 100%;
    border-collapse: collapse;
}

th, td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #eee;
}

th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #333;
}

.content-cell {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.status-pending {
    background-color: #fff3cd;
}

.status-complete {
    background-color: #d1e7dd;
}

.action-button {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    background-color: #0d6efd;
    color: white;
    cursor: pointer;
}

.action-button:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
}

.action-button:hover:not(:disabled) {
    background-color: #0b5ed7;
}

.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin-top: 20px;
}

.page-button {
    padding: 8px 16px;
    border: 1px solid #ddd;
    background-color: white;
    border-radius: 4px;
    cursor: pointer;
}

.page-button:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
}

.page-info {
    font-size: 14px;
    color: #666;
}

.report-id-link {
    color: #0d6efd;
    cursor: pointer;
    text-decoration: underline;
}

.report-id-link:hover {
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

.report-detail {
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