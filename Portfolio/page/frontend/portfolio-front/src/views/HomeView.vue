<template>
  <div @click="removeAllDocuments">대화내용 초기화</div>
  <!-- <CodeViewer contentsLanguageType="markdown" :contents="response.join('')" /> -->
  <MarkdownViewer :contents="response.join('')" />

  <div ref="searchContainer" class="search-container" :class="{ moved: movedToBottom }">
    <input ref="searchInput" v-model="prompt" @keydown.enter="sendPrompt" type="text" placeholder="무엇이든 물어보세요..."
      class="search-input" />
  </div>
</template>

<script setup>
import MarkdownViewer from '@/components/MarkdownViewer.vue';
import { ref, onMounted, onUnmounted, watchEffect } from 'vue';
import { PersistentCollection } from 'signaldb';
import vueReactivityAdapter from 'signaldb-plugin-vue';

// Define the Chat schema
const ChatSchema = {
  name: 'Chat',
  properties: {
    _id: 'string',
    message: 'string',
    response: 'string[]',
    timestamp: 'int'
  },
  primaryKey: '_id',
};

// Initialize SignalDB PersistentCollection with Vue reactivity adapter
const chats = new PersistentCollection('chats', {
  reactivity: vueReactivityAdapter,
});

const test = ref('');
const movedToBottom = ref(false);
const searchContainer = ref(null);
const searchInput = ref(null);

// Function to save chat to SignalDB
const saveChatHistory = async (message, response) => {
  try {
    chats.insert({
      _id: new Date().toISOString(),
      message,
      response,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('Error saving to SignalDB:', err);
  }
};

// Function to remove all documents
const removeAllDocuments = async () => {
  try {
    const allChats = chats.find({});
    allChats.fetch().forEach(chat => {
      chats.remove(chat._id);
    });
    response.value = [];
    test.value = '';
  } catch (err) {
    console.error('Error removing documents:', err);
  }
};

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
    const resultObject = JSON.parse(event.data)
    response.value.push(resultObject.r); // Append each message part to the response array
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
const sendPrompt = async () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    // Add a short delay to see the value before moving
    setTimeout(() => {
      movedToBottom.value = true;
    }, 200);
    response.value = []; // Clear previous responses
    errorMessage.value = "";
    ws.send(prompt.value);

    // Save the chat history after receiving response
    await saveChatHistory(prompt.value, response.value);
  } else {
    errorMessage.value = "WebSocket connection is not open";
  }
};

// Load chat history on mount
const loadChatHistory = () => {
  try {
    const chatsCursor = chats.find({});
    const allChats = chatsCursor.fetch().sort((a, b) => b.timestamp - a.timestamp);
    if (allChats.length > 0) {
      const lastChat = allChats[0];
      test.value = lastChat.message;
      response.value = lastChat.response;
    }
  } catch (err) {
    console.error('Error loading chat history:', err);
  }
};

// Set up WebSocket and load chat history on component mount
onMounted(() => {
  connectWebSocket();
  loadChatHistory();
});

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