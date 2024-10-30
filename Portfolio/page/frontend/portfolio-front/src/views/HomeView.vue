<template>
  <div @click="removeAllDocuments">대화내용 초기화</div>
  <!-- <CodeViewer contentsLanguageType="markdown" :contents="response.join('')" /> -->
  <MarkdownViewer :contents="test" />

  <div ref="searchContainer" class="search-container" :class="{ moved: movedToBottom }">
    <input ref="searchInput" v-model="test" @keydown.enter="sendPrompt" type="text" placeholder="무엇이든 물어보세요..."
      class="search-input" />
  </div>
</template>

<script setup>
import MarkdownViewer from '@/components/MarkdownViewer.vue';
import { ref, onMounted, onUnmounted } from 'vue';

const test = ref('');
const movedToBottom = ref(false);
const searchContainer = ref(null);
const searchInput = ref(null);

// Triggered when Enter key is pressed
const handleSearch = () => {
  // Add a short delay to see the value before moving
  setTimeout(() => {
    movedToBottom.value = true;
  }, 200);
};

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
    // Add a short delay to see the value before moving
    setTimeout(() => {
      movedToBottom.value = true;
    }, 200);
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

<style scoped>
.search-container {
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: all 1s ease;
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  padding: 10px;
  border-radius: 8px;
  width: 60%;
  max-width: 30em;
}

.search-container.moved {
  top: 90%;
  left: 50%;
  transform: translate(-50%, -10%);
  width: 70%;
  height: 3em;
  padding: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.search-input {
  width: 100%;
  height: 40px;
  border: none;
  padding: 8px;
  border-radius: 4px;
  outline: none;
  font-size: 1.4em;
  font-weight: 500;
  transition: height 1s ease, width 1s ease;
}

.search-container.moved .search-input {
  width: 100%;
  height: 20px;
  font-size: 1rem;
}
</style>