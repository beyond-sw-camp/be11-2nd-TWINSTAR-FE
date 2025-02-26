import PostCreate from "@/views/PostCreate.vue";
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
    }


]