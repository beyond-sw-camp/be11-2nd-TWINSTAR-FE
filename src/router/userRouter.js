import UserLogin from "@/views/UserLogin.vue"
import UserCreate from "@/views/UserCreate.vue"
import UserList from "@/views/UserList.vue"
import MyProfile from "@/views/MyProfile.vue"

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
        meta: { requiresAuth: true } //로그인 여부 체크
      },  
      {
        path: '/user/myprofile',
        name: 'MyProfile',
        component: MyProfile,//로그인 여부 체크
      }
      
]