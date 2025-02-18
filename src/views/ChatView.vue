<template>
    <div class="chat-container">
        <!-- 채팅방 헤더 -->
        <div class="chat-header">
            <div class="user-info">
                <div class="profile-image"></div>
                <div class="username">사용자님</div>
            </div>
        </div>

        <!-- 메시지 영역 -->
        <div class="messages-container" ref="messagesContainer">
            <div v-for="(message, index) in messages" 
                 :key="index" 
                 :class="['message-wrapper', message.isSent ? 'sent-wrapper' : 'received-wrapper']">
                <div :class="['message-bubble', message.isSent ? 'sent' : 'received']">
                    {{ message.content }}
                </div>
                <div :class="['timestamp', message.isSent ? 'timestamp-sent' : 'timestamp-received']">
                    {{ message.timestamp }}
                </div>
            </div>
        </div>

        <!-- 메시지 입력 폼 -->
        <div class="input-container">
            <input 
                v-model="newMessage" 
                @keyup.enter="sendMessage"
                placeholder="메시지 보내기..."
                class="message-input"
            >
            <button 
                @click="sendMessage" 
                class="send-button"
                :class="{ 'active': newMessage.trim() }"
            >
                보내기
            </button>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ChatRoom',
    data() {
        return {
            messages: [
                {
                    content: '안녕하세요!',
                    timestamp: '오후 4:30',
                    isSent: false
                },
                {
                    content: '네, 반갑습니다!',
                    timestamp: '오후 4:31',
                    isSent: true
                }
            ],
            newMessage: ''
        }
    },
    methods: {
        scrollToBottom() {
            this.$nextTick(() => {
                const container = this.$refs.messagesContainer;
                container.scrollTop = container.scrollHeight;
            });
        },
        sendMessage() {
            if (!this.newMessage.trim()) return;
            
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const ampm = hours >= 12 ? '오후' : '오전';
            const formattedHours = hours % 12 || 12;
            
            this.messages.push({
                content: this.newMessage,
                timestamp: `${ampm} ${formattedHours}:${minutes.toString().padStart(2, '0')}`,
                isSent: true
            });
            
            this.newMessage = '';
            this.scrollToBottom();
        }
    },
    mounted() {
        this.scrollToBottom();
    },
    updated() {
        this.scrollToBottom();
    }
}
</script>

<style scoped>
.chat-container {
    max-width: 600px;
    margin: 0 auto;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: white;
}

.chat-header {
    padding: 16px;
    border-bottom: 1px solid #dbdbdb;
    background-color: white;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.profile-image {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: #dbdbdb;
}

.username {
    font-weight: 600;
    font-size: 16px;
}

.messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background-color: white;
}

.message-wrapper {
    margin-bottom: 8px;
    clear: both;
    display: flex;
    flex-direction: column;
    max-width: 70%;
}

.sent-wrapper {
    float: right;
    align-items: flex-end;
}

.received-wrapper {
    float: left;
    align-items: flex-start;
}

.message-bubble {
    padding: 12px 16px;
    border-radius: 22px;
    font-size: 14px;
    word-wrap: break-word;
    margin: 2px;
}

.sent {
    background-color: #efefef;
}

.received {
    background-color: #efefef;
    border: 1px solid #dbdbdb;
}

.timestamp {
    font-size: 11px;
    color: #8e8e8e;
    margin: 4px 8px;
}

.timestamp-sent {
    text-align: right;
}

.timestamp-received {
    text-align: left;
}

.input-container {
    padding: 16px;
    border-top: 1px solid #dbdbdb;
    background-color: white;
    display: flex;
    gap: 8px;
}

.message-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #dbdbdb;
    border-radius: 22px;
    outline: none;
    font-size: 14px;
}

.message-input:focus {
    border-color: #a8a8a8;
}

.send-button {
    border: none;
    background: none;
    color: #0095f6;
    font-weight: 600;
    font-size: 14px;
    opacity: 0.3;
    cursor: default;
}

.send-button.active {
    opacity: 1;
    cursor: pointer;
}

/* 모바일 최적화 */
@media (max-width: 600px) {
    .chat-container {
        height: 100vh;
        max-width: 100%;
    }
}
</style>   
