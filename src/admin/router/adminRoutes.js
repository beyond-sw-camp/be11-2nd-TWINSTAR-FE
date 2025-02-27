import { createRouter, createWebHistory } from 'vue-router';
import UserManagement from '../views/UserManagement.vue';
import ReportManagement from '../views/ReportManagement.vue';

export const adminRouter = [

    {
        path: '/admin/users',
        name: 'UserManagement',
        component: UserManagement,
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
