<template>
    <div class="chat-container">
      <!-- 채팅방 목록 -->
      <div class="chat-rooms-sidebar">
        <div class="sidebar-header">
          <h2>메시지</h2>
          <button class="new-chat-btn" @click="openNewChatModal">
            <i class="fas fa-plus"></i>
          </button>
        </div>
        <div class="chat-rooms-list">
          <div
            v-for="room in chatRooms"
            :key="room.roomId"
            class="chat-room-item"
            @click="selectRoom(room.roomId)"
            :class="{ active: room.roomId === selectedRoomId }"
          >
            <div class="room-image">
              <img :src="room.roomImage || '/default-avatar.png'" alt="방 이미지" />
            </div>
            <div class="room-info">
              <div class="room-name">{{ room.roomName }}</div>
              <div v-if="room.notReadCount > 0" class="unread-count">{{ room.notReadCount }}</div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- 채팅 메인 영역 -->
      <div class="chat-main" v-if="selectedRoomId">
        <div class="chat-header">
          <div class="room-info">
            <img :src="selectedRoomImage || '/default-avatar.png'" alt="방 이미지" />
            <span>{{ selectedRoomName }}</span>
          </div>
        </div>
  
        <div class="chat-messages" @scroll="handleScroll">
          <div v-if="isLoading" class="loading-messages">
            메시지 불러오는 중...
          </div>
          <div
            v-for="(message) in chatMessages"
            :key="message.messageId"
            :class="['message', message.senderNickName === currentUser ? 'my-message' : 'other-message']"
          >
            <img 
              v-if="message.senderNickName !== currentUser" 
              :src="selectedRoomImage || 'https://i.pinimg.com/474x/3b/73/a1/3b73a13983f88f8b84e130bb3fb29e17.jpg'" 
              class="profile-image" 
              alt="프로필 이미지"
            />
            <div class="message-content">
              <div v-if="message.senderNickName !== currentUser" class="sender">{{ message.senderNickName }}</div>
              <div class="text-wrapper">
                <div class="text">{{ message.message }}</div>
                <div class="time">{{ formatTime(message.sendTime) }}</div>
              </div>
            </div>
          </div>
        </div>
  
        <div class="chat-input">
          <input v-model="messageText" placeholder="메시지를 입력하세요..." @keyup.enter="sendMessage" />
          <button @click="sendMessage">전송</button>
        </div>
      </div>
  
      <!-- 새로운 채팅방 생성 모달 -->
      <div v-if="showNewChatModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>새로운 채팅방</h3>
            <button class="close-btn" @click="showNewChatModal = false">&times;</button>
          </div>
          
          <div class="search-box">
            <input 
              v-model="searchKeyword" 
              placeholder="사용자 검색..."
              class="search-input"
              @input="searchUsers"
            />
          </div>
  
          <div class="users-list">
            <div 
              v-for="user in filteredUsers" 
              :key="user.userId"
              class="user-item"
              :class="{ 'selected': selectedUsers.includes(user.userId) }"
              @click="toggleUserSelection(user)"
            >
              <div class="user-info">
                <img :src="user.profileImage || '/default-avatar.png'" alt="프로필 이미지" />
                <span>{{ user.nickName }}</span>
              </div>
              <div class="checkbox">
                <i v-if="selectedUsers.includes(user.userId)" class="fas fa-check"></i>
              </div>
            </div>
          </div>
  
          <div class="modal-footer">
            <button 
              @click="createNewChatRoom" 
              :disabled="selectedUsers.length === 0"
              class="create-btn"
            >
              채팅방 만들기 ({{ selectedUsers.length }}명 선택됨)
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import SockJS from "sockjs-client";
  import Stomp from "webstomp-client";
  import axios from "axios";
  import { jwtDecode } from "jwt-decode";
  
  export default {
    data() {
      return {
        stompClient: null,
        connected: false,
        chatMessages: [],
        messageText: "",
        currentUser: "",
        chatRooms: [],
        selectedRoomId: null,
        selectedRoomName: "",
        selectedRoomImage: "",
        showNewChatModal: false,
        usersList: [],
        selectedUsers: [],
        searchKeyword: "",
        searchTimeout: null,
        currentPage: 0,
        isLoading: false,
        hasMoreMessages: true,
      };
    },
    computed: {
      filteredUsers() {
        if (!this.searchKeyword) return this.usersList;
        const keyword = this.searchKeyword.toLowerCase();
        return this.usersList.filter(user => 
          user.nickName.toLowerCase().includes(keyword)
        );
      }
    },
    methods: {
      async selectRoom(roomId) {
        this.selectedRoomId = roomId;
        const selectedRoom = this.chatRooms.find((room) => room.roomId === roomId);
        if (selectedRoom) {
          this.selectedRoomName = selectedRoom.roomName;
          this.selectedRoomImage = selectedRoom.roomImage;
          selectedRoom.notReadCount = 0;
        }
        
        // 채팅 메시지를 가져오기 전에 초기화
        this.chatMessages = [];
        this.currentPage = 0;
        this.hasMoreMessages = true;
        
        await this.readChatRoom(roomId);
        await this.fetchChatMessages(0, true); // true 파라미터 추가
      },
  
      async readChatRoom(roomId) {
        try {
          await axios.post(`${process.env.VUE_APP_API_BASE_URL}/chat/read/${roomId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
        } catch (error) {
          console.error("채팅방 읽음 처리 실패:", error);
        }
      },
  
      async fetchChatRooms() {
        try {
          const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/chat/room/list`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          this.chatRooms = response.data.result;
        } catch (error) {
          console.error("채팅방 목록 조회 실패:", error);
        }
      },
  
      async fetchChatMessages(page = 0, isInitialLoad = false) {
        try {
          const response = await axios.get(
            `${process.env.VUE_APP_API_BASE_URL}/chat/room/detail/${this.selectedRoomId}`,
            {
              params: { page, size: 20 },
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            }
          );
          
          const newMessages = response.data.result.content;
          
          if (isInitialLoad) {
            // 초기 로드시에는 최신 메시지가 아래에 오도록 정렬
            this.chatMessages = newMessages.reverse();
          } else if (page === 0) {
            this.chatMessages = newMessages;
          } else {
            this.chatMessages = [...newMessages, ...this.chatMessages];
          }
          
          this.hasMoreMessages = !response.data.result.last;
          this.currentPage = page;
          
          this.$nextTick(() => {
            if (isInitialLoad || page === 0) this.scrollToBottom();
          });
        } catch (error) {
          console.error("채팅 메시지 조회 실패:", error);
        }
      },
  
      connectWebSocket() {
        const token = localStorage.getItem("token");
        if (!token) return;
  
        if (this.stompClient && this.connected) {
          this.stompClient.disconnect();
        }
  
        const socket = new SockJS(`${process.env.VUE_APP_API_BASE_URL}/connect`);
        this.stompClient = Stomp.over(socket);
  
        this.stompClient.connect({ Authorization: `Bearer ${token}` }, (frame) => {
          this.connected = true;
          console.log(" 웹소켓 연결 성공:", frame);
  
          // 모든 채팅방을 구독
          this.chatRooms.forEach((room) => {
            this.stompClient.subscribe(`/topic/${room.roomId}`, (message) => {
              const receivedMessage = JSON.parse(message.body);
              console.log("실시간 메시지 수신:", receivedMessage);
  
              // 채팅방 찾기
              const chatRoomIndex = this.chatRooms.findIndex((r) => r.roomId === receivedMessage.roomId);
              if (chatRoomIndex !== -1) {
                // 현재 채팅방 객체 복사
                const chatRoom = { ...this.chatRooms[chatRoomIndex] };
                
                // 현재 선택된 채팅방이 아닌 경우에만 안 읽은 메시지 수 증가
                if (receivedMessage.roomId !== this.selectedRoomId) {
                  chatRoom.notReadCount += 1;
                }
  
                // 채팅방 목록에서 현재 채팅방 제거
                this.chatRooms.splice(chatRoomIndex, 1);
                // 채팅방을 맨 앞으로 추가
                this.chatRooms.unshift(chatRoom);
  
                // 현재 선택된 채팅방인 경우 메시지 추가 및 스크롤
                if (receivedMessage.roomId === this.selectedRoomId) {
                  this.chatMessages.push(receivedMessage);
                  this.$nextTick(() => this.scrollToBottom());
                }
              }
            });
          });
        });
      },
  
      sendMessage() {
        if (!this.messageText.trim() || !this.stompClient || !this.connected) return;
  
        const messagePayload = {
          message: this.messageText,
          senderNickName: this.currentUser,
        };
  
        this.stompClient.send(`/publish/${this.selectedRoomId}`, JSON.stringify(messagePayload), {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        });
  
        this.messageText = "";
        this.$nextTick(() => this.scrollToBottom());
      },
  
      scrollToBottom() {
        this.$nextTick(() => {
          const chatMessages = document.querySelector(".chat-messages");
          if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
        });
      },
  
      formatTime(timestamp) {
        const date = new Date(timestamp);
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? '오후' : '오전';
        
        // 12시간제로 변환
        hours = hours % 12;
        hours = hours ? hours : 12; // 0시를 12시로 표시
        
        return `${ampm} ${hours}:${minutes}`;
      },
  
      openNewChatModal() {
        this.showNewChatModal = true;
        this.selectedUsers = [];
        this.searchKeyword = "";
        this.fetchUsers();
      },
  
      async fetchUsers() {
        try {
          const response = await axios.get(
            `${process.env.VUE_APP_API_BASE_URL}/user/list`,
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
          );
          // 현재 사용자를 제외한 사용자 목록을 표시
          this.usersList = response.data.result.filter(
            user => user.nickName !== this.currentUser
          );
        } catch (error) {
          console.error("사용자 목록 조회 실패:", error);
        }
      },
  
      toggleUserSelection(user) {
        const index = this.selectedUsers.indexOf(user.userId);
        if (index === -1) {
          this.selectedUsers.push(user.userId);
        } else {
          this.selectedUsers.splice(index, 1);
        }
      },
  
      searchUsers() {
        // 디바운스 처리
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          // 필요한 경우 서버에서 검색 결과를 가져올 수 있습니다
        }, 300);
      },
  
      async createNewChatRoom() {
        try {
          const response = await axios.post(
            `${process.env.VUE_APP_API_BASE_URL}/chat/room`,
            { 
              participants: this.selectedUsers,
            },
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
          );
          
          await this.fetchChatRooms();
          this.showNewChatModal = false;
          
          const newRoom = response.data.result;
          this.selectRoom(newRoom.roomId);
        } catch (error) {
          console.error("채팅방 생성 실패:", error);
          alert("채팅방 생성에 실패했습니다.");
        }
      },
  
      handleScroll(event) {
        const element = event.target;
        if (element.scrollTop <= 100 && !this.isLoading && this.hasMoreMessages) {
          this.loadMoreMessages();
        }
      },
  
      async loadMoreMessages() {
        if (this.isLoading || !this.hasMoreMessages) return;
        
        this.isLoading = true;
        const prevScrollHeight = document.querySelector(".chat-messages").scrollHeight;
        
        await this.fetchChatMessages(this.currentPage + 1);
        
        this.$nextTick(() => {
          const newScrollHeight = document.querySelector(".chat-messages").scrollHeight;
          document.querySelector(".chat-messages").scrollTop = 
            newScrollHeight - prevScrollHeight;
          this.isLoading = false;
        });
      },
    },
    async created() {
      const token = localStorage.getItem("token");
      const decodedToken = jwtDecode(token);
      this.currentUser = decodedToken.nickName;
  
      await this.fetchChatRooms();
      this.connectWebSocket();
    },
    beforeUnmount() {
      if (this.stompClient && this.connected) {
        this.stompClient.disconnect();
      }
    },
  };
  </script>
  

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
  background-color: white;
  margin-left: 240px; /* 헤더 컴포넌트의 너비만큼 여백 추가 */
  font-family: 'Noto Sans KR', sans-serif;
}

.chat-rooms-sidebar {
  width: 350px;
  border-right: 1px solid #dbdbdb;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  left: 240px; /* 헤더 컴포넌트 너비만큼 이동 */
  background: white;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #dbdbdb;
}

.sidebar-header h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.new-chat-btn {
  background: none;
  border: none;
  color: #0095f6;
  cursor: pointer;
  font-size: 20px;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.new-chat-btn:hover {
  color: #00376b;
}

.chat-rooms-list {
  overflow-y: auto;
}

.chat-room-item {
  display: flex;
  padding: 15px;
  cursor: pointer;
  align-items: center;
  transition: background-color 0.2s;
}

.chat-room-item:hover {
  background-color: #fafafa;
}

.chat-room-item.active {
  background-color: #efefef;
}

.room-image img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  margin-right: 15px;
  object-fit: cover;  /* 이미지 비율 유지 */
}

.room-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.unread-count {
  background-color: #0095f6;
  color: white;
  padding: 2px 8px;
  border-radius: 50%;
  font-size: 12px;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 350px; /* 채팅방 목록 너비만큼 여백 추가 */
}

.chat-header {
  padding: 15px;
  border-bottom: 1px solid #dbdbdb;
}

.chat-header .room-info {
  display: flex;
  align-items: center;
}

.chat-header img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 10px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.message {
  margin: 10px 0;
  display: flex;
  align-items: flex-start;
  gap: 8px;  /* 이미지와 메시지 사이 간격 */
}

.my-message {
  justify-content: flex-end;
}

.profile-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.message-wrapper {
  display: flex;
  flex-direction: column;
}

.message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

/* 내 메시지일 때 정렬 방향 조정 */
.my-message .message-content {
  align-items: flex-end;
}

/* 메시지와 시간을 감싸는 새로운 컨테이너 */
.text-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

/* 내 메시지일 때 순서 변경 */
.my-message .text-wrapper {
  flex-direction: row-reverse;
}

.text {
  background-color: #efefef;
  padding: 10px;
  border-radius: 20px;
  word-wrap: break-word;
  max-width: 400px;
  font-weight: 400;
  line-height: 1.4;
}

/* 내 메시지 스타일 추가 */
.my-message .text {
  background-color: #0095f6;  /* 파란색 배경 */
  color: white;  /* 텍스트 색상 흰색으로 */
}

.time {
  font-size: 11px;
  color: #8e8e8e;
  white-space: nowrap; /* 시간이 한 줄로 표시되도록 */
  font-weight: 300;
}

.chat-input {
  padding: 20px;
  border-top: 1px solid #dbdbdb;
  display: flex;
}

.chat-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #dbdbdb;
  border-radius: 20px;
  margin-right: 10px;
}

.chat-input button {
  padding: 8px 20px;
  background-color: #0095f6;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.chat-input button:hover {
  background-color: #0081d6;
}

.loading {
  text-align: center;
  padding: 10px;
  color: #8e8e8e;
}

.no-chat-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8e8e8e;
  font-size: 16px;
}

.sender {
  font-weight: 500;
  font-size: 0.9rem;
  color: #262626;
}

.room-name {
  font-weight: 500;
  font-size: 0.95rem;
}

.chat-header .room-info span {
  font-weight: 500;
  font-size: 1rem;
}

.modal-content {
  background-color: white;
  padding: 0;
  border-radius: 10px;
  width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #dbdbdb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #8e8e8e;
}

.search-box {
  padding: 10px 20px;
  border-bottom: 1px solid #dbdbdb;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dbdbdb;
  border-radius: 5px;
}

.users-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-item:hover {
  background-color: #fafafa;
}

.user-item.selected {
  background-color: #e8f0fe;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-info img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.checkbox {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #dbdbdb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0095f6;
}

.selected .checkbox {
  background-color: #0095f6;
  border-color: #0095f6;
  color: white;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #dbdbdb;
}

.create-btn {
  width: 100%;
  padding: 10px;
  background-color: #0095f6;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.create-btn:disabled {
  background-color: #b2dffc;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-messages {
  text-align: center;
  padding: 10px;
  color: #8e8e8e;
  font-size: 14px;
}
</style>
