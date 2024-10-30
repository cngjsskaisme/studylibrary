<template>
  <div>
    <h1>WebSocket Prompt RAG Client</h1>
    <input v-model="prompt" @keyup.enter="sendPrompt" placeholder="Enter your prompt" />
    <button @click="sendPrompt">Send Prompt</button>
    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
    <div v-if="response" class="response">
      <span v-for="(message, index) in response" :key="index">{{ message }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const prompt = ref("");
const response = ref([]);
const errorMessage = ref("");
let ws;

// Function to initialize the WebSocket connection with the specified path
const connectWebSocket = () => {
  ws = new WebSocket("ws://localhost:8080/api/v1/chat"); // Include the path here

  ws.onopen = () => {
    console.log("WebSocket connection opened");
    errorMessage.value = "";
  };

  ws.onmessage = (event) => {
    response.value.push(event.data); // Append each message part to the response array
  };

  ws.onerror = (error) => {
    errorMessage.value = "WebSocket error: " + error.message;
    console.error("WebSocket error:", error);
  };

  ws.onclose = () => {
    console.log("WebSocket connection closed");
    errorMessage.value = "WebSocket connection closed";
  };
};

// Function to send the prompt to the WebSocket server
const sendPrompt = () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    response.value = []; // Clear previous responses
    errorMessage.value = "";
    ws.send(prompt.value);
  } else {
    errorMessage.value = "WebSocket connection is not open";
  }
};

// Set up WebSocket on component mount and clean up on unmount
onMounted(connectWebSocket);
onUnmounted(() => {
  if (ws) ws.close();
});
</script>

<style>
.error {
  color: red;
}

.response {
  margin-top: 1rem;
  font-family: monospace;
  white-space: pre-wrap;
}
</style>
