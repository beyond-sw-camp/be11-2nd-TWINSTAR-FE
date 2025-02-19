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
        const token = localStorage.getItem('token')
        if(token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
    },
    error => {
        // 에러가 발생시, 사용자의 본래요청의 화면으로 되돌아가야함.
        return Promise.reject(error);
    }

)

axios.interceptors.response.use(
    response => response,
    async error => {
        if(error.response && error.response.status === 401 ) {
            try{
                const refreshToken = localStorage.getItem('refreshToken') // rt가 없으면 로컬클리어 후
                if (!refreshToken) {                                      // 로그인 페이지로 이동
                    localStorage.clear()                                  
                    router.push('/user/login')                            
                    return Promise.reject(error)                          //실패상태로 요청 반환
                }
                localStorage.removeItem('token')                          // 토큰 삭제후 새로 at요청,저장
                const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/user/refresh-token`, {refreshToken})
                const token = response.data.token;
                localStorage.setItem('token', token)
                return axios(error.config)
            } catch(e) {
                localStorage.clear()
                router.push('/user/login')
            }
        }
        return Promise.reject(error)
    }

)



app.use(vuetify)
app.use(router)
app.mount('#app')
