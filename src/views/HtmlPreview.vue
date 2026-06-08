<template>
  <ToolCard title="HTML 预览" description="实时预览 HTML 代码效果">
    <div class="flex flex-col lg:flex-row gap-6">
      <div class="flex-1">
        <label for="html-input" class="label-text">HTML 代码</label>
        <textarea
          id="html-input"
          v-model="htmlCode"
          class="textarea-field font-mono h-[calc(100vh-12.5rem)]"
          placeholder="输入HTML代码..."
          @input="updatePreview"
        ></textarea>
      </div>
      <div class="flex-1">
        <label class="label-text">预览效果</label>
        <div class="overflow-hidden rounded-md border border-line bg-surface-primary">
          <iframe
            ref="previewFrame"
            class="w-full h-[calc(100vh-12.5rem)] border-0"
            sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
            @load="updatePreview"
          ></iframe>
        </div>
      </div>
    </div>
  </ToolCard>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import ToolCard from '../components/ToolCard.vue'

const htmlCode = ref('')
const previewFrame = ref<HTMLIFrameElement | null>(null)

const updatePreview = () => {
  if (!previewFrame.value) return

  const doc = previewFrame.value.contentDocument
  if (!doc) return

  // 检查是否是完整的HTML文档
  const hasHtmlTag = htmlCode.value.toLowerCase().includes('<html')
  const hasHeadTag = htmlCode.value.toLowerCase().includes('<head')
  const hasBodyTag = htmlCode.value.toLowerCase().includes('<body')

  if (hasHtmlTag && hasHeadTag && hasBodyTag) {
    // 如果是完整的HTML文档，直接渲染
    doc.open()
    doc.write(htmlCode.value)
    doc.close()
  } else {
    // 如果不是完整的HTML文档，创建一个完整的HTML文档
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          ${htmlCode.value}
        </body>
      </html>
    `
    doc.open()
    doc.write(fullHtml)
    doc.close()
  }
}

// 监听htmlCode的变化
watch(htmlCode, updatePreview)

// 组件挂载后初始化预览
onMounted(() => {
  updatePreview()
})
</script>

<style scoped>
textarea {
  resize: none;
}
</style>
