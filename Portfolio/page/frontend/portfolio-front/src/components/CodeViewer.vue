<template>
  <div ref="editor" class="editor-container chatgpt-markdown">
    <!-- Custom cursor displayed only when cursorVisible is true -->
    <div v-if="cursorVisible" class="custom-cursor" :style="{
      left: cursorPosition.x + 'px',
      top: cursorPosition.y + 'px',
      height: cursorPosition.height + 'px'
    }"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'

// Import additional Codemirror features
import { languages } from '@codemirror/language-data'
import { highlightActiveLine, highlightSpecialChars } from '@codemirror/view'

// Props
const props = defineProps({
  contentsLanguageType: {
    type: String,
    required: true
  },
  contents: {
    type: String,
    required: true
  },
  effect: {
    type: String,
    default: null
  }
})

// Editor reference
const editor = ref(null)
let view = null

// Cursor visibility and position state
const cursorVisible = ref(false)
const cursorPosition = ref({ x: 0, y: 0, height: 0 })

onMounted(() => {
  // Language mode based on contentsLanguageType
  const language = (() => {
    switch (props.contentsLanguageType) {
      case 'javascript':
        return javascript()
      case 'html':
        return html()
      case 'css':
        return css()
      case 'markdown':
        // Configure Markdown with ChatGPT-style extensions and language support
        return markdown({ base: markdownLanguage, codeLanguages: languages })
      default:
        return javascript() // Default to JS if unknown
    }
  })()

  // Add line wrapping and highlight active line extensions
  const extensions = [
    basicSetup,
    language,
    EditorView.lineWrapping,
    highlightActiveLine(),
    highlightSpecialChars()
  ]

  // Editor state setup
  const state = EditorState.create({
    doc: props.contents.replace(/<br\s*\/?>/gi, '\n'), // Replace <br> tags with newlines
    extensions
  })

  // Create the EditorView
  view = new EditorView({
    state,
    parent: editor.value
  })

  // Position cursor at the end of the initial content
  updateCursorToEnd()
})

// Watch for content updates and briefly show the cursor
watch(
  () => props.contents,
  (newContent) => {
    if (view) {
      // Replace <br> tags with newlines before updating the editor content
      const transformedContent = newContent.replace(/<br\s*\/?>/gi, '\n')

      // Update editor content
      const transaction = view.state.update({
        changes: { from: 0, to: view.state.doc.length, insert: transformedContent }
      })
      view.dispatch(transaction)

      // Position cursor at the end of the new content
      updateCursorToEnd()

      // Show cursor briefly and hide after 300ms
      cursorVisible.value = true
      setTimeout(() => {
        cursorVisible.value = false
      }, 3000)
    }
  }
)

// Function to update cursor position to the end of the content
function updateCursorToEnd() {
  const endPosition = view.state.doc.length // Position at the end of the document
  const coords = view.coordsAtPos(endPosition) // Get the coordinates at the end

  if (coords) {
    cursorPosition.value = {
      x: coords.left,
      y: coords.top - 6,
      height: coords.bottom - coords.top
    }
  }
}

// Clean up on unmount
onUnmounted(() => {
  if (view) {
    view.destroy()
  }
})
</script>

<style scoped>
/* ChatGPT-style Markdown */
.chatgpt-markdown {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  padding: 20px;
  background-color: #f7f7f8;
  border-radius: 8px;
  color: #333;
}

.chatgpt-markdown h1,
.chatgpt-markdown h2,
.chatgpt-markdown h3 {
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 4px;
  margin-bottom: 8px;
  color: #2c2c2c;
}

.chatgpt-markdown p {
  margin: 12px 0;
}

.chatgpt-markdown a {
  color: #1a73e8;
  text-decoration: none;
}

.chatgpt-markdown a:hover {
  text-decoration: underline;
}

.chatgpt-markdown code {
  background-color: #f0f0f5;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.95em;
  color: #d63384;
}

.chatgpt-markdown pre {
  background-color: #f4f5f7;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.9em;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.chatgpt-markdown blockquote {
  border-left: 4px solid #d1d5db;
  padding-left: 16px;
  margin: 12px 0;
  color: #555;
}

.chatgpt-markdown ul,
.chatgpt-markdown ol {
  padding-left: 20px;
  margin: 12px 0;
}

.chatgpt-markdown li {
  margin: 6px 0;
}

.custom-cursor {
  position: absolute;
  width: 5px;
  background-color: black;
  animation: none;
  /* Ensure the cursor does not blink */
}

.editor-container {
  position: relative;
  /* To position the custom cursor absolutely within this container */
}
</style>
