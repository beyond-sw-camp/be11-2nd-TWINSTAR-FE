import {createRouter, createWebHistory} from 'vue-router';
import { userRouter } from './userRouter';
import { chatRouter } from './chatRouter';

const routes = [
    ...userRouter,
    ...chatRouter,
]

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;