import SettingsView from '@/views/settings/SettingsView.vue'

export const settingsRouter = [
    {
        path: '/settings',
        name: 'Settings',
        component: SettingsView,
        meta: { requiresAuth: true }
    }
] 