<template>
  <CodeViewer 
    contentsLanguageType="javascript" 
    :contents="searchQuery"
    effect="typing"
  />

  <div ref="searchContainer" class="search-container" :class="{ moved: movedToBottom }">
    <input
      ref="searchInput"
      v-model="searchQuery"
      @keydown.enter="handleSearch"
      type="text"
      placeholder="무엇이든 물어보세요..."
      class="search-input"
    />
  </div>
</template>

<script setup>
import CodeViewer from '@/components/CodeViewer.vue';
import { ref } from 'vue';

const searchQuery = ref('');
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

const contents = ref("")
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