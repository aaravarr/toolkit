<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, shallowRef } from 'vue'
import { basicSetup, EditorView } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorRef = ref<HTMLElement | null>(null)
const editorView = shallowRef<EditorView | null>(null)

// 检测是否为暗色模式
function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark')
}

onMounted(() => {
  if (!editorRef.value) return

  const extensions = [
    basicSetup,
    json(),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        emit('update:modelValue', update.state.doc.toString())
      }
    }),
    EditorView.theme({
      '&': {
        height: '100%',
        fontSize: '14px',
      },
      '.cm-scroller': {
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Cascadia Code', 'Menlo', 'Monaco', 'Courier New', monospace",
        overflow: 'auto',
      },
      '.cm-content': {
        padding: '8px 0',
      },
      '.cm-gutters': {
        minWidth: '40px',
      },
    }),
    EditorState.tabSize.of(2),
  ]

  if (isDarkMode()) {
    extensions.push(oneDark)
  }

  const state = EditorState.create({
    doc: props.modelValue || '',
    extensions,
  })

  editorView.value = new EditorView({
    state,
    parent: editorRef.value,
  })
})

onBeforeUnmount(() => {
  if (editorView.value) {
    editorView.value.destroy()
    editorView.value = null
  }
})

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  if (editorView.value && newVal !== editorView.value.state.doc.toString()) {
    editorView.value.dispatch({
      changes: {
        from: 0,
        to: editorView.value.state.doc.length,
        insert: newVal,
      },
    })
  }
})
</script>

<template>
  <div ref="editorRef" class="json-editor border border-line rounded-lg overflow-hidden"></div>
</template>

<style scoped>
.json-editor {
  height: 100%;
  min-height: 200px;
}

.json-editor :deep(.cm-editor) {
  height: 100%;
}

.json-editor :deep(.cm-focused) {
  outline: none;
}
</style>
