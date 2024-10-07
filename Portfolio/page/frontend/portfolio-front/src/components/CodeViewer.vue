<template>
  <div ref="editor" class="editor-container">
    <!-- Custom cursor rendered only when typing is in progress -->
    <div
      v-if="cursorVisible"
      class="custom-cursor"
      :style="{
        left: cursorPosition.x + 'px',
        top: cursorPosition.y + 'px',
        height: cursorPosition.height + 'px'
      }"
    ></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { markdown } from '@codemirror/lang-markdown'

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
let typingTimeout = null // Track typing timeout to reset it

// Cursor visibility and position state
const cursorVisible = ref(true)
const cursorPosition = ref({ x: 0, y: 0, height: 0 })

// Typing effect function
function typingEffect(content, speed = 20) {
  let currentIndex = 0
  cursorVisible.value = true // Show cursor when typing starts

  function typeNextChar() {
    if (currentIndex < content.length && view) {
      const transaction = view.state.update({
        changes: { from: currentIndex, to: currentIndex, insert: content[currentIndex] }
      })
      view.dispatch(transaction)
      currentIndex++

      // Get cursor position and update cursorPosition
      const coords = view.coordsAtPos(currentIndex)
      if (coords) {
        cursorPosition.value = {
          x: coords.left,
          y: coords.top - 6,
          height: coords.bottom - coords.top
        }
      }

      typingTimeout = setTimeout(typeNextChar, speed)
    } else {
      cursorVisible.value = false // Hide cursor when typing is done
    }
  }

  typeNextChar()
}

// Function to reset editor content and start typing effect
function resetTypingEffect() {
  if (view) {
    // Clear editor content
    const transaction = view.state.update({
      changes: { from: 0, to: view.state.doc.length, insert: '' }
    })
    view.dispatch(transaction)

    // Clear any existing timeout to prevent overlap
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }

    // Start the typing effect
    typingEffect(props.contents)
  }
}

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
        return markdown()
      default:
        return javascript() // Default to JS if unknown
    }
  })()

  // Editor state setup
  const extensions = [basicSetup, language]

  const state = EditorState.create({
    doc: props.effect === 'typing' ? '' : props.contents,
    extensions: extensions
  })

  // Create the EditorView
  view = new EditorView({
    state,
    parent: editor.value
  })

  // Start typing effect if effect is 'typing'
  if (props.effect === 'typing') {
    resetTypingEffect()
  }
})

// Watch for content changes and reset typing effect if needed
watch(
  () => props.contents,
  (newContent) => {
    if (view) {
      if (props.effect === 'typing') {
        resetTypingEffect()
      } else {
        const transaction = view.state.update({
          changes: { from: 0, to: view.state.doc.length, insert: newContent }
        })
        view.dispatch(transaction)
      }
    }
  }
)

// Clean up on unmount
onUnmounted(() => {
  if (typingTimeout) {
    clearTimeout(typingTimeout)
  }
})
</script>

<style scoped>
.editor-container {
  position: relative; /* To position the custom cursor absolutely within this container */
}

/* Custom cursor styling */
.custom-cursor {
  position: absolute;
  width: 5px;
  background-color: black;
  /* Ensure the cursor does not blink */
  animation: none;
}
</style>
