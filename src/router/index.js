import {createRouter, createWebHistory} from 'vue-router';
import { userRouter } from './userRouter';

const routes = [
    ...userRouter,
]

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;