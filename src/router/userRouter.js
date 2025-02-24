import UserLogin from "@/views/UserLogin.vue"
import UserCreate from "@/views/UserCreate.vue"
import UserList from "@/views/UserList.vue"
import MyProfile from "@/views/MyProfile.vue"
import OtherUserProfile from "@/views/OtherUserProfile.vue"

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
        path: '/user/list',
        name: 'UserList',
        component: UserList,
        meta: { requiresAuth: true }
    },
    {
        path: '/myprofile',
        name: 'MyProfile',
        component: MyProfile,
        meta: { requiresAuth: true }
    },
    {
        path: '/user/profile/:id',
        name: 'OtherUserProfile',
        component: OtherUserProfile,
        props: true
    }
]