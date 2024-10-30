<template>
  <div class="chat-container">
    <div class="chat-bubble">
      <button class="copy-button" @click="copyText(contents)">Copy</button>
      <div class="markdown-content">
        <div v-html="displayedContent"></div>
        <span v-if="showCursor" class="cursor">|</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css'; // Choose any theme for syntax highlighting

// Props
const props = defineProps({
  contents: {
    type: String,
    required: true,
  },
});

// Reactive data for rendered content and cursor display
const displayedContent = ref('');
const showCursor = ref(false);

// Set up `marked` with syntax highlighting
marked.setOptions({
  highlight: (code, language) => {
    const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
    return hljs.highlight(code, { language: validLanguage }).value;
  },
});

// Watch `contents` for changes and show the cursor temporarily on update
watch(
  () => props.contents,
  async (newContent) => {
    displayedContent.value = marked.parse(newContent);
    addCopyButtonsToCodeBlocks();
    showCursorTemporarily();
  },
  { immediate: true }
);

// Method to temporarily show the cursor on content update
function showCursorTemporarily() {
  showCursor.value = true;
  setTimeout(() => {
    showCursor.value = false;
  }, 500); // Hide the cursor after 500ms
}

// Methods to manually control cursor visibility
function showCursorMethod() {
  showCursor.value = true;
}

function disappearCursorMethod() {
  showCursor.value = false;
}

// Expose `showCursorMethod` and `disappearCursorMethod`
defineExpose({
  showCursor: showCursorMethod,
  disappearCursor: disappearCursorMethod,
});

// Add copy buttons to each code block
function addCopyButtonsToCodeBlocks() {
  nextTick(() => {
    const codeBlocks = document.querySelectorAll('.markdown-content pre code');
    codeBlocks.forEach((block) => {
      if (!block.parentElement.querySelector('.code-copy-button')) {
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy';
        copyButton.className = 'copy-button code-copy-button';
        copyButton.onclick = () => copyText(block.innerText);
        block.parentElement.prepend(copyButton);
      }
    });
  });
}

// Copy function for chat bubbles and code blocks
function copyText(content) {
  navigator.clipboard.writeText(content).then(() => {
    alert('Copied to clipboard!');
  });
}

// Run the function to add copy buttons after initial render
onMounted(addCopyButtonsToCodeBlocks);
</script>

<style scoped>
.chat-container {
  display: flex;
  justify-content: flex-start;
  padding: 10px;
}

.chat-bubble {
  background-color: #f1f1f5;
  color: #333;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  max-width: 80%;
  position: relative;
}

.copy-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8em;
}

.copy-button:hover {
  background-color: #0056b3;
}

.markdown-content h1 {
  font-size: 1.5em;
  color: #333;
  margin-top: 0;
}

.markdown-content p {
  margin: 0.5em 0;
}

.markdown-content a {
  color: #007bff;
  text-decoration: none;
}

.markdown-content a:hover {
  text-decoration: underline;
}

.markdown-content blockquote {
  padding: 10px;
  background-color: #f0f0f0;
  border-left: 4px solid #d0d0d0;
  margin: 10px 0;
  font-style: italic;
}

.markdown-content ul {
  padding-left: 20px;
  list-style-type: disc;
}

.markdown-content li {
  margin: 5px 0;
}

.markdown-content pre {
  background-color: #2d2d2d;
  color: #f8f8f2;
  padding: 10px;
  border-radius: 8px;
  overflow-x: auto;
  position: relative;
}

.markdown-content code {
  font-family: 'Courier New', Courier, monospace;
}

.cursor {
  display: inline-block;
  width: 1px;
  background-color: #333;
  animation: blink 1s step-start infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.markdown-content strong {
  font-weight: bold;
}

.markdown-content em {
  font-style: italic;
}
</style>
