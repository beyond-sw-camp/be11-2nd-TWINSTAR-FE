import UserLogin from "@/views/UserLogin.vue"
import UserCreate from "@/views/UserCreate.vue"
import UserProfile from "@/views/Profile.vue"

export const userRouter = [
    {
        path: '/user/login',
        name: 'UserLogin',
        component: UserLogin
    },
    {
        path: '/user/create',
        name: 'UserCreate',
        component: UserCreate
    },
    {
        path: '/profile/:id',
        name: 'UserProfile',
        component: UserProfile,
        props: true,
        meta: { requiresAuth: true },
        beforeEnter: (to, from, next) => {
            console.log('프로필 라우트 진입, params:', to.params);
            next();
        }
    }
]