import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import vuetify from './plugins/vuetify';
import '@mdi/font/css/materialdesignicons.css';
import axios from 'axios';
import '@fortawesome/fontawesome-free/css/all.css';

const app = createApp(App)

axios.interceptors.request.use(
    config => {
        // 로그인과 회원가입 요청은 인터셉터 제외
        if (config.url?.includes('/member/login') || config.url?.includes('/member/signup')) {
            return config;
        }
        
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
)
// 모든 axios요청에서 401 또는 403 응답을 받을 경우에 interceptor을 통해 rt를 통한 at재발급
// rt마저 만료되었을 때는 로그인창으로 이동.
axios.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('리프레시 토큰이 없습니다');
                }
                
                const response = await axios.post(
                    `${process.env.VUE_APP_API_BASE_URL}/user/refresh-token`,
                    { refreshToken },
                    { 
                        headers: { 'Content-Type': 'application/json' },
                        _retry: true  // 리프레시 토큰 요청임을 표시
                    }
                );
                
                const newToken = response.data.token;
                localStorage.setItem('token', newToken);
                
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return axios(originalRequest);
                
            } catch (e) {
                console.error('토큰 갱신 실패:', e);
                localStorage.clear();
                window.location.href = '/user/login';
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
)

app.use(vuetify)
app.use(router)
app.mount('#app')
