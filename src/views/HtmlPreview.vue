<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Code2, Columns2, Eye, Maximize2, Minimize2 } from 'lucide-vue-next'
import ToolCard from '../components/ToolCard.vue'
import SegmentedControl from '../components/SegmentedControl.vue'

type ViewMode = 'split' | 'editor' | 'preview'

const htmlCode = ref(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: system-ui, -apple-system, sans-serif;
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #eff6ff, #f8fafc);
        color: #111827;
      }
      .card {
        width: min(420px, calc(100% - 2rem));
        padding: 24px;
        border-radius: 16px;
        background: white;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      }
      h1 {
        margin: 0 0 8px;
        font-size: 1.5rem;
      }
      p {
        margin: 0;
        color: #6b7280;
        line-height: 1.6;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>HTML 预览</h1>
      <p>在左侧编辑 HTML，右侧会实时渲染效果。也可以切换到全屏编辑或全屏预览。</p>
    </div>
  </body>
</html>`)

const viewMode = ref<ViewMode>('split')
const isImmersive = ref(false)
const previewFrame = ref<HTMLIFrameElement | null>(null)

const viewOptions = [
  { label: '分栏', value: 'split' as const, icon: Columns2 },
  { label: '全屏编辑', value: 'editor' as const, icon: Code2 },
  { label: '全屏预览', value: 'preview' as const, icon: Eye },
]

const showEditor = computed(() => viewMode.value === 'split' || viewMode.value === 'editor')
const showPreview = computed(() => viewMode.value === 'split' || viewMode.value === 'preview')

const layoutClass = computed(() => {
  if (viewMode.value === 'split') {
    return 'grid-cols-1 lg:grid-cols-2'
  }
  return 'grid-cols-1'
})

const panelHeightClass = computed(() => {
  return isImmersive.value
    ? 'h-[calc(100dvh-7.5rem)]'
    : 'h-[calc(100vh-16rem)] min-h-[400px]'
})

const updatePreview = () => {
  if (!previewFrame.value) return

  const doc = previewFrame.value.contentDocument
  if (!doc) return

  const source = htmlCode.value
  const lower = source.toLowerCase()
  const isFullDocument = lower.includes('<html') && lower.includes('<head') && lower.includes('<body')

  const content = isFullDocument
    ? source
    : `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
    ${source}
  </body>
</html>`

  doc.open()
  doc.write(content)
  doc.close()
}

const setViewMode = (mode: ViewMode) => {
  viewMode.value = mode
  if (mode !== 'split') {
    isImmersive.value = true
  }
}

const toggleImmersive = () => {
  isImmersive.value = !isImmersive.value
}

const exitImmersive = () => {
  isImmersive.value = false
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isImmersive.value) {
    exitImmersive()
  }
}

watch(htmlCode, updatePreview)

watch(showPreview, async (visible) => {
  if (!visible) return
  await nextTick()
  updatePreview()
})

watch(isImmersive, (immersive) => {
  document.body.style.overflow = immersive ? 'hidden' : ''
})

onMounted(() => {
  updatePreview()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div :class="isImmersive ? 'fixed inset-0 z-50 bg-[var(--bg-secondary)] overflow-auto' : ''">
    <div :class="isImmersive ? 'min-h-full p-3 sm:p-4' : ''">
      <ToolCard title="HTML 预览" description="实时预览 HTML 代码效果，支持全屏编辑与全屏预览">
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <SegmentedControl
            :model-value="viewMode"
            :options="viewOptions"
            @update:model-value="setViewMode"
          />

          <div class="flex-1"></div>

          <button
            type="button"
            class="btn-secondary !py-1.5 !px-2.5 !text-xs inline-flex items-center gap-1.5 cursor-pointer"
            :title="isImmersive ? '退出沉浸视图' : '沉浸视图'"
            @click="toggleImmersive"
          >
            <Minimize2 v-if="isImmersive" class="w-3.5 h-3.5" />
            <Maximize2 v-else class="w-3.5 h-3.5" />
            <span>{{ isImmersive ? '退出沉浸' : '沉浸视图' }}</span>
          </button>
        </div>

        <div class="grid gap-4" :class="[layoutClass, panelHeightClass]">
          <div v-show="showEditor" class="flex min-h-0 flex-col">
            <div class="mb-1.5 flex items-center justify-between gap-2">
              <label for="html-input" class="label-text !mb-0">HTML 代码</label>
              <button
                v-if="viewMode !== 'editor'"
                type="button"
                class="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                @click="setViewMode('editor')"
              >
                全屏编辑
              </button>
            </div>
            <textarea
              id="html-input"
              v-model="htmlCode"
              class="textarea-field font-mono min-h-0 flex-1"
              placeholder="输入 HTML 代码..."
              spellcheck="false"
            ></textarea>
          </div>

          <div v-show="showPreview" class="flex min-h-0 flex-col">
            <div class="mb-1.5 flex items-center justify-between gap-2">
              <label class="label-text !mb-0">预览效果</label>
              <button
                v-if="viewMode !== 'preview'"
                type="button"
                class="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                @click="setViewMode('preview')"
              >
                全屏预览
              </button>
            </div>
            <div class="min-h-0 flex-1 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-primary)]">
              <iframe
                ref="previewFrame"
                class="h-full w-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
                title="HTML 预览"
                @load="updatePreview"
              ></iframe>
            </div>
          </div>
        </div>
      </ToolCard>
    </div>
  </div>
</template>

<style scoped>
textarea {
  resize: none;
}
</style>
