<template>
    <div>
        <v-container>
            <v-row>
                <v-col>
                    <v-card>
                        <v-card-title>
                            Fuck    
                        </v-card-title>
                        <v-card-text>
                            <v-textarea
                                v-model="message"
                                label="메시지"
                                outlined
                                rows="3"
                            ></v-textarea>
                            <v-btn
                                color="primary"
                                @click="sendMessage"
                            >
                                전송
                            </v-btn>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script>
export default {
    name: 'Fuck',
    data() {
        return {
            message: ''
        }
    },
    methods: {
        sendMessage() {
            console.log(this.message);
        }
    }   
}
</script>


