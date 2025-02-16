<template>
    <v-container>
        <v-row>
            <v-col cols="12" sm="2" md="4">
                <v-card>
                    <v-card-title text-h5 text-center>
                        로그인
                    </v-card-title>
                    <v-card-text>
                        <v-form @keydown.enter="doLogin">

                        </v-form>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>
<script>
import axios from 'axios'

export default{
    data() {
        return {
            email: "",
            password: ""
        }
    },
    method: {
        async doLogin() {
            const loginData = {email:this.email, password:this.password};
            const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/member/doLogin`, loginData)
            const token = response.data.token
            const refreshToken = response.data.refreshToken
            localStorage.setItem('token', token) //왼쪽의 토큰은 키값, 오른쪽의 토큰은 받아온 토큰을 밸류로 세팅.
            localStorage.setItem('refreshToken', refreshToken)
            window.location.href = '/';
        }
    }
}
</script>