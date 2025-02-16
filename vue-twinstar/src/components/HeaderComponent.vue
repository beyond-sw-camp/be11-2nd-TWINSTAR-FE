<template>
  <v-navigation-drawer app class="d-flex flex-column">
    <v-list class="flex-grow-1">
      <v-list-item>
        <v-list-item-title class="title blue--text font-weight-bold">Twinstar</v-list-item-title>
      </v-list-item>

      <v-divider></v-divider> <!-- 구분선 표시 -->
      <!-- 네비게이션 메뉴 (홈, 알림, 검색, 팔로우, 메시지, 설정) -->
      <v-list-item v-for="(item, index) in menuItems" :key="index" :to="item.route" density="compact">
        <template v-slot:prepend>
          <v-icon class="menu-icon mt-6 ml-10" >{{ item.icon }}</v-icon>
        </template>
        <v-list-item-title class="menu-text mt-6">{{ item.text }}</v-list-item-title>
      </v-list-item>
    </v-list>

      <v-btn class="mt-10 ml-15" color="rgba(69, 199, 255, 1)" dark>게시물작성</v-btn>

<!-- 프로필 (최하단 고정) * 내페이지 추가필요-->
<v-list-item class="profile-section" :to="'/profile'">  
      <template v-slot:prepend>
        <v-avatar size="40">
          <img src="https://randomuser.me/api/portraits/men/1.jpg" alt="프로필사진" onerror="this.src='https://randomuser.me/api/portraits/men/1.jpg'"/>
        </v-avatar>
      </template>
      <v-list-item-content>
        <v-list-item-title class="profile-name">내 프로필</v-list-item-title>
        <v-list-item-subtitle class="profile-id">@hong_gildong</v-list-item-subtitle>
      </v-list-item-content>
</v-list-item>



    <!-- 더보기 버튼 -->
    <v-menu v-model="menu" offset-y>
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" class="more-button mx-15 mb-3 mt-16" color="white" elevation="0">
          <v-icon>mdi-menu</v-icon> 더 보기
        </v-btn>
      </template>
      <!-- 더보기 클릭시 추가메뉴 -->
      <v-card class="more-menu">
        <v-list>
          <v-list-item v-for="(item, index) in moreMenuItems" :key="index" @click="handleMenuClick(item.route)">
            <template v-slot:prepend>
              <v-icon>{{ item.icon }}</v-icon>
            </template>
            <v-list-item-title>{{ item.text }}</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item @click="logout">
            <v-list-item-title>로그아웃</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>

  </v-navigation-drawer>
</template>

<script>
export default {
  data() {
    return {
      menuItems: [
        { text: "홈", icon: "mdi-home", route: "/" },
        { text: "알림", icon: "mdi-bell", route: "/alarm" },
        { text: "검색", icon: "mdi-magnify", route: "/search" },
        { text: "팔로우", icon: "mdi-heart", route: "/follow" },
        { text: "메시지", icon: "mdi-message", route: "/messages" },
      ],
      moreMenuItems: [
        { text: "설정", icon: "mdi-cog", route: "/settings" },
        { text: "모드 전환", icon: "mdi-theme-light-dark", route: "/theme" },
        { text: "신고", icon: "mdi-alert-circle-outline", route: "/report" },
      ],
    };
  },
  methods: {
    handleMenuClick(route){
      this.$router.push(route)
      this.menu = false //메뉴닫기
    },
    logout(){
      console.log("로그아웃");
      this.menu = false
    }
  },
};
</script>

<style scoped>

/* 네비게이션 바 전체를 세로 정렬 */
.v-navigation-drawer {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
/* 프로필 스타일 */
.profile-section {
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
}


/* 네비게이션 메뉴 영역확장 (빈 공간 확보) */
.v-list {
  flex-grow: 1;
}

/* 아이콘과 텍스트 사이 간격 */
.menu-icon {
  margin-right: 1px; 
}

 /* 텍스트 크기 */
.menu-text {
  font-size: 17px;
}

/* "더 보기" 버튼 스타일 */
.more-button {
  text-transform: none;
  font-size: 16px;
  font-weight: bold;
}
/* "더 보기" 메뉴 스타일 */
.more-menu {
  min-width: 250px;
  border-radius: 12px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
}



</style>