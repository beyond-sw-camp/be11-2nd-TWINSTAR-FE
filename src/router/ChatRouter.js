import ChatView from "@/views/ChatView.vue";
import ChatView2 from "@/views/ChatView2.vue";
export const chatRouter = [
    {
        path: '/chat',
        name: 'ChatView',
        component: ChatView
    },
    {
        path: '/chat2',
        name: 'ChatView2',
        component: ChatView2
    }

]
