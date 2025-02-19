<template>
<v-app>
  <!-- 로그인페이지가 아닐때만 헤더표시 -->
  <HeaderComponent v-if="!isLoginPage && !isCreatePage"/> 
  <v-main>
  <router-view/>
  </v-main>
</v-app>
</template>

<script>
import HeaderComponent from './components/HeaderComponent.vue'

export default {
  components: {
    HeaderComponent,
  },
  computed: {
    isLoginPage() {
      return this.$route.path === "/user/login";
    },
    isCreatePage(){
      return this.$route.path === "/user/create";
    }
  }
}
</script>

<!-- <style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style> -->
