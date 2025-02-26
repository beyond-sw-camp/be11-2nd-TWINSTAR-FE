import PostCreate from "@/views/PostCreate.vue";
import PostDetail from "@/views/PostDetail.vue";
import PostListView from "@/views/PostListView.vue";
export const postRouter = [
    {
        path: '/post/create',
        name: 'PostCreate',
        component: PostCreate
    },
    {
        path: '/',
        name: 'PostList',
        component: PostListView
    },
    {
        path: '/post/detail/:postId',
        name: 'PostDetail',
        component: PostDetail
    }

]