import {createRouter, createWebHistory} from 'vue-router';
import { userRouter } from './userRouter';
import { chatRouter } from './ChatRouter';
import { postRouter } from './PostRouter';
import { adminRouter } from '../admin/router/adminRoutes';
import { jwtDecode } from 'jwt-decode';
import UserManagement from '@/admin/views/UserManagement.vue';

const routes = [
    ...userRouter,
    ...chatRouter,
    ...adminRouter,
    ...postRouter,
    {
        path: '/admin/users',
        name: 'UserManagement',
        component: UserManagement,
        meta: { requiresAdmin: true }  // 관리자 권한 필요
    },
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
});

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token'); // 또는 쿠키에서 토큰 가져오기
    
    const isTokenExpired = (token) => {
        if (!token) return true;
        try {
            const payload = jwtDecode(token);
            return payload.exp * 1000 < Date.now();
        } catch {
            return true;
        }
    }

    // 인증이 필요없는 페이지들
    const publicPaths = ['/user/login', '/user/create'];
    
    // 관리자 권한 확인
    const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
    
    if (requiresAdmin) {
        try {
            const payload = jwtDecode(token);
            if (payload.role !== 'ADMIN') {
                next('/'); // 관리자가 아닌 경우 메인 페이지로
                return;
            }
        } catch {
            next('/user/login');
            return;
        }
    }
    
    // 공개 페이지가 아니고, 토큰이 없거나 만료된 경우
    if (!publicPaths.includes(to.path) && (!token || isTokenExpired(token))) {
        next('/user/login');
    } else {
        next();
    }
});

export default router;