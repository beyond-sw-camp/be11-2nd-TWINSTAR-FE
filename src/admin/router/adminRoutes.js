import { createRouter, createWebHistory } from 'vue-router';
import AdminDashboard from '../views/AdminDashboard.vue';
import UserManagement from '../views/UserManagement.vue';
import PostManagement from '../views/PostManagement.vue';
import ReportManagement from '../views/ReportManagement.vue';

export const adminRouter = [
    {
        path: '/admin/dashboard',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: { requiresAdmin: true }
    },
    {
        path: '/admin/users',
        name: 'UserManagement',
        component: UserManagement,
        meta: { requiresAdmin: true }
    },
    {
        path: '/admin/posts',
        name: 'PostManagement',
        component: PostManagement,
        meta: { requiresAdmin: true }
    },
    {
        path: '/admin/reports',
        name: 'ReportManagement',
        component: ReportManagement,
        meta: { requiresAdmin: true }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes: adminRouter
});

export default router;
