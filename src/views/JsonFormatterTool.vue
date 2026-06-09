<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Braces,
  FileUp,
  TreePine,
  Table2,
  Minimize2,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Trash2,
  Download,
  Indent,
} from 'lucide-vue-next'
import ToolCard from '../components/ToolCard.vue'
import CustomSelect from '../components/CustomSelect.vue'
import SegmentedControl from '../components/SegmentedControl.vue'
import JsonEditor from '../components/JsonEditor.vue'

// State
const inputText = ref('')
const viewMode = ref<'tree' | 'table' | 'minified'>('tree')
const indentSize = ref(2)
const treeData = ref<any>(null)
const parsedResult = ref<any>(null)
const parseError = ref('')
const copiedNode = ref<string | null>(null)

// 表格相关
const tableData = ref<any[]>([])
const tableHeaders = ref<string[]>([])
const cellHistory = ref<string[]>([])

// 缩进选项
const indentOptions = [
  { label: '2 空格', value: 2 },
  { label: '4 空格', value: 4 },
  { label: 'Tab', value: 1 },
]

// 视图选项
const viewOptions = [
  { label: '树形', value: 'tree', icon: TreePine },
  { label: '压缩', value: 'minified', icon: Minimize2 },
  { label: '表格', value: 'table', icon: Table2 },
]

// 智能解析 JSON：支持直接 JSON、转义 JSON（{\"key\":\"val\"}）、双重编码 JSON
function smartJsonParse(val: string): { parsed: any; error: string } {
  // 1. 直接解析
  try {
    let parsed = JSON.parse(val)
    // 如果结果是字符串，尝试解析内层 JSON（双重编码场景）
    if (typeof parsed === 'string') {
      try {
        const inner = JSON.parse(parsed)
        if (typeof inner === 'object' && inner !== null) {
          parsed = inner
        }
      } catch {}
    }
    return { parsed, error: '' }
  } catch (directError: any) {
    // 2. 检测转义 JSON（包含 \"）
    if (val.includes('\\"')) {
      // 方法 A：包裹引号利用 JSON.parse 正确处理所有转义序列
      try {
        const unescaped = JSON.parse('"' + val + '"')
        if (typeof unescaped === 'string') {
          try {
            return { parsed: JSON.parse(unescaped), error: '' }
          } catch {}
        }
      } catch {}

      // 方法 B：简单替换 \" → "
      try {
        const unescaped = val.replace(/\\"/g, '"')
        return { parsed: JSON.parse(unescaped), error: '' }
      } catch {}
    }

    return { parsed: null, error: directError.message || 'JSON 解析失败' }
  }
}

// 自动解析 JSON
watch(inputText, (val) => {
  if (!val.trim()) {
    parsedResult.value = null
    treeData.value = null
    tableData.value = []
    tableHeaders.value = []
    parseError.value = ''
    return
  }

  const { parsed, error } = smartJsonParse(val)
  if (error) {
    parsedResult.value = null
    treeData.value = null
    tableData.value = []
    tableHeaders.value = []
    parseError.value = error
  } else {
    parsedResult.value = parsed
    treeData.value = parsed
    parseError.value = ''
    updateTableData(parsed)
  }
}, { immediate: true })

// 更新表格数据
function updateTableData(data: any) {
  if (Array.isArray(data)) {
    tableData.value = data
    if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
      tableHeaders.value = Object.keys(data[0])
    } else {
      tableHeaders.value = []
    }
  } else if (typeof data === 'object' && data !== null) {
    tableData.value = [data]
    tableHeaders.value = Object.keys(data)
  } else {
    tableData.value = []
    tableHeaders.value = []
  }
}

// 格式化输出
const formattedOutput = computed(() => {
  if (parsedResult.value === null) return ''
  return JSON.stringify(parsedResult.value, null, indentSize.value)
})

// 压缩输出
const minifiedOutput = computed(() => {
  if (parsedResult.value === null) return ''
  return JSON.stringify(parsedResult.value)
})

// 复制压缩结果
function copyMinified() {
  if (minifiedOutput.value) {
    navigator.clipboard.writeText(minifiedOutput.value)
  }
}

// 格式化编辑器内容（同时去转义）
function formatEditorContent() {
  if (!inputText.value.trim()) return
  const { parsed, error } = smartJsonParse(inputText.value)
  if (!error && parsed !== null) {
    inputText.value = JSON.stringify(parsed, null, indentSize.value)
  }
}

// 清空
function clearAll() {
  inputText.value = ''
}

// 文件上传
function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    inputText.value = e.target?.result as string
  }
  reader.readAsText(file)
  target.value = ''
}

// 下载结果
function downloadResult() {
  if (!formattedOutput.value) return

  const blob = new Blob([formattedOutput.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'formatted.json'
  a.click()
  URL.revokeObjectURL(url)
}

// 复制节点内容
function copyNodeContent(path: string, key: string) {
  const value = getNodeValue(path)
  if (value !== undefined) {
    let formattedValue: string
    if (value === null) {
      formattedValue = 'null'
    } else if (typeof value === 'object') {
      formattedValue = JSON.stringify(value, null, 2)
    } else if (typeof value === 'string') {
      formattedValue = `"${value}"`
    } else {
      formattedValue = String(value)
    }
    const text = key ? `"${key}": ${formattedValue}` : formattedValue
    navigator.clipboard.writeText(text)
    copiedNode.value = path
    setTimeout(() => { copiedNode.value = null }, 2000)
  }
}

// 获取节点值
function getNodeValue(path: string): any {
  if (!parsedResult.value) return undefined
  const parts = path.replace(/^\$\.?/, '').split(/\.|\[(\d+)\]/).filter(Boolean)
  let current = parsedResult.value
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    current = current[part]
  }
  return current
}

// 表格单元格双击
function handleCellDoubleClick(content: any) {
  try {
    let newContent = ''
    if (typeof content === 'object' && content !== null) {
      newContent = JSON.stringify(content, null, 2)
    } else {
      const parsed = JSON.parse(content)
      if (typeof parsed === 'object' && parsed !== null) {
        newContent = JSON.stringify(parsed, null, 2)
      }
    }
    if (newContent) {
      cellHistory.value.push(inputText.value)
      inputText.value = newContent
    }
  } catch (e) {
    // 忽略
  }
}

// 返回上级
function goBack() {
  if (cellHistory.value.length > 0) {
    inputText.value = cellHistory.value.pop() || ''
  }
}

// 格式化单元格显示
function formatCell(value: any): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
</script>

<template>
  <ToolCard title="JSON 格式化" description="粘贴 JSON 自动格式化，支持树形视图、表格视图和节点复制">
    <div class="flex flex-col lg:flex-row gap-4 h-[calc(100vh-220px)] min-h-[500px] w-full max-w-full overflow-hidden">
      <!-- 左侧：输入区域 -->
      <div class="w-full lg:w-1/2 lg:max-w-[50%] flex flex-col min-w-0">
        <div class="flex items-center justify-between mb-2 h-8">
          <label class="label-text">输入 JSON</label>
          <div class="flex items-center gap-1">
            <button
              class="btn-secondary !p-1.5"
              @click="formatEditorContent"
              title="格式化 JSON"
            >
              <Indent class="w-4 h-4" />
            </button>
            <button
              class="btn-secondary !p-1.5 text-red-500 hover:text-red-600"
              @click="clearAll"
              title="清空"
            >
              <Trash2 class="w-4 h-4" />
            </button>
            <label
              class="btn-secondary !p-1.5 cursor-pointer"
              title="上传 JSON 文件"
            >
              <FileUp class="w-4 h-4" />
              <input
                type="file"
                accept=".json,.txt"
                class="hidden"
                @change="handleFileUpload"
              />
            </label>
          </div>
        </div>
        <div class="flex-1 min-h-0">
          <JsonEditor
            v-model="inputText"
            placeholder='粘贴 JSON 数据，支持转义格式 {\"key\":\"val\"}'
          />
        </div>
        <!-- 错误提示 -->
        <div
          v-if="parseError"
          class="mt-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg"
        >
          {{ parseError }}
        </div>
      </div>

      <!-- 右侧：展示区域 -->
      <div class="w-full lg:w-1/2 lg:max-w-[50%] flex flex-col min-w-0">
        <div class="flex items-center justify-between mb-2 h-8">
          <div class="flex items-center gap-2">
            <label class="label-text">视图模式</label>
            <SegmentedControl
              v-model="viewMode"
              :options="viewOptions"
            />
          </div>
          <div class="flex items-center gap-1">
            <CustomSelect
              v-model="indentSize"
              :options="indentOptions"
            />
            <button
              v-if="formattedOutput"
              class="btn-secondary !p-1.5"
              @click="downloadResult"
              title="下载 JSON 文件"
            >
              <Download class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- 树形视图 -->
        <div
          v-if="viewMode === 'tree'"
          class="flex-1 overflow-auto bg-surface-secondary border border-line rounded-lg p-4"
        >
          <TreeView
            v-if="treeData !== null"
            :data="treeData"
            path="$"
            :copied-node="copiedNode"
            @copy="copyNodeContent"
          />
          <div
            v-else
            class="flex items-center justify-center h-full text-content-tertiary"
          >
            <Braces class="w-8 h-8 mr-2 opacity-50" />
            <span>在左侧输入 JSON</span>
          </div>
        </div>

        <!-- 表格视图 -->
        <div
          v-if="viewMode === 'table'"
          class="flex-1 min-w-0 overflow-hidden flex flex-col bg-surface-secondary border border-line rounded-lg"
        >
          <!-- 表格提示 -->
          <div
            v-if="tableData.length > 0"
            class="px-4 py-2 bg-accent-soft border-b border-line flex items-center justify-between"
          >
            <span class="text-sm text-accent">双击单元格可解析嵌套的 JSON</span>
            <button
              v-if="cellHistory.length > 0"
              class="btn-secondary btn-sm"
              @click="goBack"
            >
              返回上级
            </button>
          </div>

          <!-- 表格内容 -->
          <div v-if="tableData.length > 0" class="flex-1 overflow-auto">
            <table class="divide-y divide-line">
              <thead class="bg-surface-tertiary sticky top-0 z-10">
                <tr>
                  <th
                    v-for="header in tableHeaders"
                    :key="header"
                    class="px-4 py-3 text-left text-xs font-medium text-content-secondary uppercase tracking-wider whitespace-nowrap"
                  >
                    {{ header }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-line">
                <tr
                  v-for="(row, index) in tableData"
                  :key="index"
                  class="hover:bg-surface-primary transition-colors"
                >
                  <td
                    v-for="header in tableHeaders"
                    :key="header"
                    class="px-4 py-3 text-sm text-content-primary font-mono cursor-pointer hover:bg-surface-tertiary whitespace-nowrap"
                    @dblclick="handleCellDoubleClick(row[header])"
                  >
                    {{ formatCell(row[header]) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 空状态 -->
          <div
            v-else
            class="flex-1 flex items-center justify-center text-content-tertiary"
          >
            <Table2 class="w-8 h-8 mr-2 opacity-50" />
            <span>输入 JSON 数组生成表格</span>
          </div>
        </div>

        <!-- 压缩视图 -->
        <div
          v-if="viewMode === 'minified'"
          class="flex-1 overflow-hidden flex flex-col bg-surface-secondary border border-line rounded-lg"
        >
          <div class="flex items-center justify-between px-4 py-2 border-b border-line">
            <span class="text-sm text-content-secondary">
              压缩后大小：<span class="font-mono text-content-primary">{{ minifiedOutput.length }} 字节</span>
            </span>
            <div class="flex items-center gap-1">
              <button
                v-if="minifiedOutput"
                class="btn-secondary btn-sm"
                @click="copyMinified"
                title="复制压缩结果"
              >
                <Copy class="w-3.5 h-3.5 mr-1" />
                复制
              </button>
            </div>
          </div>
          <div class="flex-1 overflow-auto p-4">
            <pre
              v-if="minifiedOutput"
              class="font-mono text-sm break-all whitespace-pre-wrap"
            >{{ minifiedOutput }}</pre>
            <div
              v-else
              class="flex items-center justify-center h-full text-content-tertiary"
            >
              <Minimize2 class="w-8 h-8 mr-2 opacity-50" />
              <span>在左侧输入 JSON</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ToolCard>
</template>

<script lang="ts">
import { defineComponent, h, type Component } from 'vue'

// 树形视图组件
const TreeView: Component = defineComponent({
  name: 'TreeView',
  props: {
    data: { type: [Object, Array, String, Number, Boolean, null], default: null },
    path: { type: String, default: '$' },
    keyName: { type: String, default: '' },
    isLast: { type: Boolean, default: true },
    depth: { type: Number, default: 0 },
    copiedNode: { type: String, default: null },
  },
  emits: ['copy'],
  setup(props, { emit }) {
    const expanded = ref(props.depth < 3)

    const isObject = computed(() => props.data !== null && typeof props.data === 'object' && !Array.isArray(props.data))
    const isArray = computed(() => Array.isArray(props.data))
    const isExpandable = computed(() => isObject.value || isArray.value)

    const entries = computed((): [string, any][] => {
      if (isObject.value) return Object.entries(props.data as Record<string, any>)
      if (isArray.value) return (props.data as any[]).map((v: any, i: number) => [String(i), v] as [string, any])
      return []
    })

    const preview = computed(() => {
      if (isArray.value) return `[${(props.data as any[]).length}]`
      if (isObject.value) return `{${Object.keys(props.data as object).length}}`
      return ''
    })

    const isCopied = computed(() => props.copiedNode === props.path)

    function getValueClass(value: any): string {
      if (value === null) return 'json-null'
      if (typeof value === 'string') return 'json-string'
      if (typeof value === 'number') return 'json-number'
      if (typeof value === 'boolean') return 'json-boolean'
      return ''
    }

    function formatValue(value: any): string {
      if (value === null) return 'null'
      if (typeof value === 'string') return `"${value}"`
      return String(value)
    }

    return () => {
      if (!isExpandable.value) {
        return h('div', { class: 'tree-node group' }, [
          h('span', { class: 'inline-flex items-center' }, [
            props.keyName ? h('span', { class: 'tree-key mr-1' }, `"${props.keyName}": `) : null,
            h('span', { class: getValueClass(props.data) }, formatValue(props.data)),
            !props.isLast ? h('span', { class: 'text-content-tertiary' }, ',') : null,
            h('button', {
              class: 'ml-1 opacity-0 group-hover:opacity-100 inline-flex items-center transition-opacity copy-btn',
              onClick: (e: Event) => { e.stopPropagation(); emit('copy', props.path, props.keyName) },
              title: '复制内容',
            }, isCopied.value
              ? h(Check, { class: 'w-3 h-3 text-green-500' })
              : h(Copy, { class: 'w-3 h-3' })
            ),
          ]),
        ])
      }

      return h('div', { class: 'tree-node' }, [
        h('div', {
          class: 'inline-flex items-center group cursor-pointer hover:bg-surface-tertiary rounded px-1 -mx-1',
          onClick: () => { expanded.value = !expanded.value },
        }, [
          h('span', { class: 'mr-0.5 text-content-tertiary' },
            expanded.value
              ? h(ChevronDown, { class: 'w-3.5 h-3.5' })
              : h(ChevronRight, { class: 'w-3.5 h-3.5' })
          ),
          props.keyName ? h('span', { class: 'tree-key mr-1' }, `"${props.keyName}"`) : null,
          h('span', { class: 'text-content-tertiary mr-1' }, isArray.value ? '[' : '{'),
          !expanded.value ? h('span', { class: 'text-content-tertiary text-sm mx-1' }, preview.value) : null,
          !expanded.value ? h('span', { class: 'text-content-tertiary' }, isArray.value ? ']' : '}') : null,
          !expanded.value && !props.isLast ? h('span', { class: 'text-content-tertiary' }, ',') : null,
          h('button', {
            class: 'ml-1 opacity-0 group-hover:opacity-100 inline-flex items-center transition-opacity copy-btn',
            onClick: (e: Event) => { e.stopPropagation(); emit('copy', props.path, props.keyName) },
            title: '复制内容',
          }, isCopied.value
            ? h(Check, { class: 'w-3 h-3 text-green-500' })
            : h(Copy, { class: 'w-3 h-3' })
          ),
        ]),
        expanded.value ? h('div', { class: 'ml-4 border-l border-line pl-2' },
          entries.value.map((entry: [string, any], index: number) => {
            const [key, value] = entry
            return h(TreeView, {
              key,
              data: value,
              path: isArray.value ? `${props.path}[${key}]` : `${props.path}.${key}`,
              keyName: isArray.value ? '' : key,
              isLast: index === entries.value.length - 1,
              depth: props.depth + 1,
              copiedNode: props.copiedNode,
              onCopy: (p: string, k: string) => emit('copy', p, k),
            })
          })
        ) : null,
        expanded.value ? h('div', { class: 'text-content-tertiary' },
          isArray.value ? ']' : '}'
        ) : null,
      ])
    }
  },
})

export default {
  components: {
    TreeView,
  },
}
</script>

<style>
.json-key {
  color: #7c3aed;
}

.json-string {
  color: #059669;
}

.json-number {
  color: #2563eb;
}

.json-boolean {
  color: #d97706;
}

.json-null {
  color: #6b7280;
  font-style: italic;
}

:root.dark .json-key {
  color: #a78bfa;
}

:root.dark .json-string {
  color: #34d399;
}

:root.dark .json-number {
  color: #60a5fa;
}

:root.dark .json-boolean {
  color: #fbbf24;
}

:root.dark .json-null {
  color: #9ca3af;
}

.tree-node {
  font-family: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Cascadia Code', 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 0.8125rem;
  line-height: 1.6;
  white-space: nowrap;
}

.copy-btn {
  color: var(--text-tertiary);
}

.copy-btn:hover {
  color: var(--accent);
}
</style>
