<template>
  <div class="chat-container">
    <!-- 채팅방 목록 사이드바 -->
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <h2>채팅</h2>
        <button @click="showCreateRoomModal = true" class="create-room-btn">
          <i class="fas fa-edit"></i>
        </button>
      </div>
      
      <div class="room-list">
        <div v-for="room in chatRoomList" 
             :key="room.roomId" 
             @click="joinChatRoom(room.roomId)"
             class="room-item">
          <div class="room-avatar">
            <i class="fas fa-users"></i>
          </div>
          <div class="room-info">
            <h3>{{ room.roomName }}</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- 채팅 메인 영역 -->
    <div class="chat-main">
      <div class="chat-messages">
        <div v-for="(msg, index) in messages" 
             :key="index" 
             :class="['message', msg.senderEmail === senderEmail ? 'my-message' : 'other-message']">
          <div class="message-content">
            <span class="sender" v-if="msg.senderEmail !== senderEmail">{{ msg.senderEmail }}</span>
            <p>{{ msg.message }}</p>
          </div>
        </div>
      </div>
      
      <div class="chat-input-container">
        <textarea v-model="newMessage" 
                  @keyup.enter="sendMessage"
                  placeholder="메시지를 입력하세요..."
                  class="chat-input"
        ></textarea>
        <button @click="sendMessage" class="send-button">전송</button>
      </div>
    </div>

    <!-- 채팅방 생성 모달 -->
    <div v-if="showCreateRoomModal" class="modal">
      <div class="modal-content">
        <h2>새로운 채팅방 만들기</h2>
        <input type="text" 
               v-model="newRoomTitle" 
               placeholder="채팅방 이름을 입력하세요"
        >
        <div class="modal-buttons">
          <button @click="createChatRoom">생성</button>
          <button @click="showCreateRoomModal = false">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SockJS from 'sockjs-client';
import Stomp from 'webstomp-client';
import axios from 'axios';

export default{
    name: 'ChatView2',
    data(){
        return {
            // 채팅방 목록
            chatRoomList: [],
            showCreateRoomModal: false,
            newRoomTitle: "",

            // 채팅 내역
            messages: [],
            newMessage: "",
            stompClient: null,
            token: "",
            senderEmail: null,
            roomId: null,
        }
    },
    async created(){
        this.loadChatRoom();
    },

    // 사용자가 현재 라우트에서 다른 라우트로 이동하려고 할때 웹소켓 연결해제
    beforeRouteLeave(to, from, next) {
        this.disconnectWebSocket();
        next();
    },

    // 화면을 완전히 꺼버렸을 때 웹소켓 연결해제
    beforeUnmount() {
        this.disconnectWebSocket();
    },
    methods: {
        // 채팅방을 들어가면 채팅 내역을 불러오고 웹소켓 연결
        async roomOpen(){
            this.senderEmail = localStorage.getItem("email");
            this.roomId = this.$route.params.roomId;
            const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/chat/history/${this.roomId}`);
            this.messages = response.data;
            this.connectWebsocket();
        },

        // 채팅방 참여
        async joinChatRoom(roomId){
            await axios.post(`${process.env.VUE_APP_API_BASE_URL}/chat/room/group/${roomId}/join`);
            this.$router.push(`/chatpage/${roomId}`);
        },

        // 채팅방 생성
        async createChatRoom(){
            const params = new URLSearchParams();
            params.append("roomName", this.newRoomTitle);
            await axios.post(`${process.env.VUE_APP_API_BASE_URL}/chat/room/group/create`, params.toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            })
            this.showCreateRoomModal = false;
            this.loadChatRoom();
        },

        // 채팅방 목록 불러오기
        async loadChatRoom(){
            const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/chat/room/group/list`);
            this.chatRoomList = response.data;
        },

        // 웹소켓 연결
        connectWebsocket(){
            if(this.stompClient && this.stompClient.connected) return;
            // sockjs는 websocket을 내장한 향상된 js 라이브러리. http엔드포인트 사용.
            const sockJs = new SockJS(`${process.env.VUE_APP_API_BASE_URL}/connect`)
            this.stompClient = Stomp.over(sockJs);
            this.token = localStorage.getItem("token");
            this.stompClient.connect({
                Authorization: `Bearer ${this.token}`
            },
                ()=>{
                    this.stompClient.subscribe(`/topic/${this.roomId}`, (message) => {
                        const parseMessage = JSON.parse(message.body);
                        this.messages.push(parseMessage);
                        this.scrollToBottom();
                    },{Authorization: `Bearer ${this.token}`})
                }
            )
        },

        // 웹소켓 연결 해제
        async disconnectWebSocket(){
            await axios.post(`${process.env.VUE_APP_API_BASE_URL}/chat/room/${this.roomId}/read`);
            if(this.stompClient && this.stompClient.connected){
                this.stompClient.unsubscribe(`/topic/${this.roomId}`);
                this.stompClient.disconnect();
            }
        },

        // 메시지 전송
        sendMessage(){
            if(this.newMessage.trim() === "")return;
            const message = {
                senderEmail: this.senderEmail,
                message: this.newMessage
            }
            this.stompClient.send(`/publish/${this.roomId}`, JSON.stringify(message));
            this.newMessage = ""
        },

        // 채팅방 스크롤 맨 아래로 이동
        scrollToBottom(){
            this.$nextTick(()=>{
                const chatBox = this.$el.querySelector(".chat-messages");
                chatBox.scrollTop = chatBox.scrollHeight;
            })
        },

    },

}
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;  /* 전체 높이 사용 */
  background-color: #fafafa;
}

.chat-sidebar {
  width: 400px;
  border-right: 1px solid #dbdbdb;
  background: white;
  height: 100%;
  overflow-y: auto;
  margin-left: 220px;  /* 헤더 컴포넌트 너비만큼 여백 추가 */
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #dbdbdb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
}

.sidebar-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin: 0;
}

.create-room-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #0095f6;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.create-room-btn:hover {
  background-color: #f0f0f0;
}

.room-list {
  overflow-y: auto;
}

.room-item {
  display: flex;
  padding: 16px;
  cursor: pointer;
  align-items: center;
  transition: background-color 0.2s;
  border-bottom: 1px solid #efefef;
}

.room-item:hover {
  background-color: #fafafa;
}

.room-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.room-avatar i {
  font-size: 24px;
  color: #666;
}

.room-info {
  flex: 1;
}

.room-info h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 4px;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.chat-input-container {
  padding: 20px;
  background: white;
  border-top: 1px solid #dbdbdb;
  display: flex;
  gap: 12px;
  align-items: center;
}

.chat-input {
  flex: 1;
  padding: 12px 20px;
  border: 1px solid #dbdbdb;
  border-radius: 24px;
  resize: none;
  min-height: 48px;
  max-height: 120px;
  font-size: 14px;
  line-height: 20px;
}

.send-button {
  padding: 12px 24px;
  background-color: #1a73e8;
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  height: 48px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-button:hover {
  background-color: #1557b0;
}

.message {
  margin: 8px 0;
  max-width: 60%;
}

.my-message {
  margin-left: auto;
}

.message-content {
  padding: 12px;
  border-radius: 20px;
  background: #efefef;
}

.my-message .message-content {
  background: #0095f6;
  color: white;
}

.sender {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 4px;
  display: block;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 400px;
}

.modal-content input {
  width: 100%;
  padding: 8px;
  margin: 16px 0;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
}

.modal-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.modal-buttons button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.modal-buttons button:first-child {
  background: #0095f6;
  color: white;
}

.modal-buttons button:last-child {
  background: #dbdbdb;
}
</style>