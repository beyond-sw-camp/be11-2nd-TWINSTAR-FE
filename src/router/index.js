import {createRouter, createWebHistory} from 'vue-router';
import { userRouter } from './userRouter';
import { chatRouter } from './ChatRouter';

const routes = [
    ...userRouter,
    ...chatRouter,
]

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token'); // 또는 쿠키에서 토큰 가져오기
    
    const isTokenExpired = (token) => {
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 < Date.now();
        } catch {
            return true;
        }
    }

    // 인증이 필요없는 페이지들
    const publicPaths = ['/user/login', '/user/create'];
    
    // 공개 페이지가 아니고, 토큰이 없거나 만료된 경우
    if (!publicPaths.includes(to.path) && (!token || isTokenExpired(token))) {
        next('/user/login');
    } else {
        next();
    }
});

export default router;