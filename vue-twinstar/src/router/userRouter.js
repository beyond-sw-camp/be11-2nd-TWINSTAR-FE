import UserLogin from "@/views/UserLogin.vue"
import UserCreate from "@/views/UserCreate.vue"
import UserList from "@/views/UserList.vue"

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
        component: UserList
      },
]