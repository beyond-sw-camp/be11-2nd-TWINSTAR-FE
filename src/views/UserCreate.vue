<template>
    <v-container>
        <v-row justify="center">
            <v-col cols="12" sm="4" md="6">
                <v-card>
                    <v-card-title class="text-h5 text-center">
                        회원가입
                    </v-card-title>
                    <v-card-text>
                        <v-form @keydown.enter="create">
                            
                            <v-text-field
                            label="email"
                            v-model="email"
                            type="email"
                            prepend-icon="mdi-email"
                            required
                            />
                            <v-text-field
                            label="password"
                            v-model="password"
                            type="password"
                            prepend-icon="mdi-lock"
                            required
                            />
                            <v-text-field
                            label="name"
                            v-model="name"
                            prepend-icon="mdi-account"
                            required
                            />
                            <v-text-field
                            label="sex"
                            v-model="sex"
                            prepend-icon="mdi-sex"
                            required
                            />
                            <v-row>
                                <v-col cols="12">
                                    <v-btn color="#c0c1ff" block @click="create()">제출</v-btn>
                                </v-col>
                            </v-row>
                        </v-form>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>
<script>
import axios from 'axios';

export default {
    data() {
        return {
            name:"",
            email:"",
            password:""
        }
    },
    methods: {
        async create() {
            try{
                // json으로 보내는 방법은 객체를 만들어주면 된다.
                const data = {name:this.name, email:this.email, password:this.password};
                await axios.post(`${process.env.VUE_APP_API_BASE_URL}/user/create`, data)
                this.$router.push('/')
            } catch(error) {
                alert(error.response.data)
            }

        }
    }
}
</script>