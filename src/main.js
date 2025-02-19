import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import '@mdi/font/css/materialdesignicons.css'
import axios from 'axios'
import '@fortawesome/fontawesome-free/css/all.css'

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
        
        // 토큰이 만료되었거나 없는 경우 (401 에러)
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }
                
                // 리프레시 토큰으로 새로운 액세스 토큰 발급 시도
                const response = await axios.post(
                    `${process.env.VUE_APP_API_BASE_URL}/member/refresh-token`,
                    { refreshToken }
                );
                
                const newToken = response.data.token;
                localStorage.setItem('token', newToken);
                
                // 새로운 토큰으로 원래 요청 재시도
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return axios(originalRequest);
                
            } catch (e) {
                // 리프레시 토큰도 만료되었거나 오류가 발생한 경우
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
