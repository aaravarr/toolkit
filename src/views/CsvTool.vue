<template>
  <ToolCard title="CSV工具" description="支持CSV文件的导入、预览和编辑">
    <!-- 错误提示 -->
    <ErrorAlert v-if="errorMessage" :message="errorMessage" @click="errorMessage = ''" />

    <!-- 输入区域 -->
    <div class="space-y-4">
      <!-- 切换按钮 -->
      <div class="flex justify-center gap-2">
        <button
          @click="inputMode = 'text'"
          :class="[
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer',
            inputMode === 'text'
              ? 'btn-primary'
              : 'btn-secondary'
          ]"
        >
          文本输入
        </button>
        <button
          @click="inputMode = 'file'"
          :class="[
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer',
            inputMode === 'file'
              ? 'btn-primary'
              : 'btn-secondary'
          ]"
        >
          文件上传
        </button>
      </div>

      <!-- 文件上传区域 -->
      <div v-if="inputMode === 'file'"
        class="border-[1.5px] border-dashed border-line rounded-xl p-6 sm:p-10 text-center cursor-pointer hover:border-accent transition-colors"
        @dragover.prevent
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".csv,.xlsx,.xls"
          class="hidden"
          @change="handleFileUpload"
        />
        <div class="space-y-2">
          <Upload class="mx-auto h-8 w-8 text-content-tertiary" />
          <p v-if="!fileName" class="text-sm text-content-secondary">拖拽文件到此处或点击上传</p>
          <p v-else class="text-sm text-content-secondary">已上传文件: {{ fileName }}</p>
          <p class="text-xs text-content-tertiary">支持 CSV、Excel 文件</p>
        </div>
      </div>

      <!-- 文本输入区域 -->
      <div v-else>
        <textarea
          id="csv-input"
          v-model="csvText"
          class="textarea-field h-60 resize-none overflow-y-auto"
          placeholder="请输入CSV格式的数据，每行一条记录，字段之间用逗号分隔"
          @input="handleTextInput"
        ></textarea>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-accent border-t-transparent"></div>
      <p class="mt-2 text-content-secondary">正在加载数据...</p>
    </div>

    <div v-else-if="csvData.length" class="mt-6">
      <!-- 导出按钮 -->
      <div class="mb-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            @click="downloadCsv"
            class="w-full inline-flex items-center justify-center rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 ring-1 ring-inset ring-blue-200 hover:bg-blue-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            :disabled="!csvData.length"
          >
            <Download class="h-4 w-4 mr-1.5" />
            导出CSV
          </button>
          <button
            @click="downloadExcel"
            class="w-full inline-flex items-center justify-center rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-600 ring-1 ring-inset ring-green-200 hover:bg-green-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            :disabled="!csvData.length"
          >
            <Download class="h-4 w-4 mr-1.5" />
            导出Excel
          </button>
          <CopyButton :text="csvTextForCopy" label="复制到剪贴板" class="w-full" size="sm" />
        </div>
      </div>

      <!-- 表格 -->
      <div class="overflow-x-auto border border-line rounded relative">
        <div class="min-w-full">
          <table class="border-collapse w-full">
            <colgroup>
              <col style="width: 40px">
              <col v-for="(_, index) in headers" :key="index" :style="{ width: getColumnWidth(index) + 'px' }">
            </colgroup>
            <thead class="sticky top-0 z-10">
              <tr class="relative">
                <th class="py-1 px-2 text-center text-sm font-semibold text-content-primary bg-surface-tertiary border-r border-line select-none relative"
                >
                </th>
                <th
                  v-for="(header, index) in headers"
                  :key="index"
                  class="py-1 px-2 text-center text-sm font-semibold text-content-primary bg-surface-tertiary border-r border-line relative select-none cursor-pointer"
                  :class="{
                    'dragging': isDragging && dragSourceIndex === index,
                    'drag-over': isDragging && dragOverIndex === index
                  }"
                  draggable="true"
                  @dragstart="handleHeaderDragStart($event, index)"
                  @dragover.prevent="handleHeaderDragOver($event, index)"
                  @dragenter.prevent="handleHeaderDragEnter($event, index)"
                  @dragleave.prevent="handleHeaderDragLeave($event, index)"
                  @drop="handleHeaderDrop($event, index)"
                  @touchstart="handleTouchStart($event, index)"
                  @touchmove="handleTouchMove($event, index)"
                  @touchend="handleTouchEnd()"
                >
                  <div class="flex items-center justify-center h-full">
                    {{ header }}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, rowIndex) in paginatedData"
                :key="rowIndex"
                class="hover:bg-surface-secondary"
              >
                <td class="whitespace-nowrap py-1 px-2 text-sm text-content-secondary text-center bg-surface-secondary relative border border-line">
                  {{ getActualRowIndex(rowIndex) }}
                </td>
                <td
                  v-for="(_, cellIndex) in row"
                  :key="cellIndex"
                  class="text-sm text-content-secondary bg-surface-primary relative border border-line hover:border-accent"
                >
                  <div class="p-0.5">
                    <textarea
                      v-model="csvData[getActualRowIndex(rowIndex)][cellIndex]"
                      class="w-full h-full resize-none outline-none bg-transparent text-sm text-content-primary font-mono"
                      @change="handleCellChange"
                      @focus="handleCellFocus($event)"
                      @blur="handleCellBlur($event)"
                      @input="autoResize($event)"
                      ref="textareas"
                      rows="1"
                    ></textarea>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 分页控制 -->
    <div v-if="csvData.length" class="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <span class="text-sm text-content-secondary">每页显示:</span>
        <CustomSelect
          :modelValue="pageSize"
          @update:modelValue="v => { pageSize = v as number; handlePageSizeChange() }"
          :options="[{ label: '50行', value: 50 }, { label: '100行', value: 100 }, { label: '200行', value: 200 }, { label: '500行', value: 500 }]"
        />
      </div>
      <div class="flex flex-col sm:flex-row items-center gap-4">
        <div class="flex items-center gap-1.5">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="btn-secondary !px-1.5 !py-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft class="w-3.5 h-3.5" />
          </button>
          <div class="flex items-center gap-0.5">
            <button
              v-for="page in displayedPages"
              :key="page"
              @click="goToPage(page)"
              :class="[
                'inline-flex items-center justify-center w-7 h-7 text-xs font-medium rounded-md transition-colors duration-200 cursor-pointer',
                page === currentPage
                  ? 'btn-primary !w-7 !h-7 !p-0 !text-xs'
                  : 'text-content-primary hover:bg-surface-secondary'
              ]"
            >
              {{ page === -1 ? '...' : page }}
            </button>
          </div>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="btn-secondary !px-1.5 !py-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
        <span class="text-sm text-content-secondary">
          共 {{ totalPages }} 页
        </span>
      </div>
    </div>

    <div v-else class="text-center text-content-secondary mt-4 text-sm">
      请上传CSV文件或输入CSV数据
    </div>
  </ToolCard>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import {
  Upload,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'
import ToolCard from '../components/ToolCard.vue'
import CopyButton from '../components/CopyButton.vue'
import ErrorAlert from '../components/ErrorAlert.vue'
import CustomSelect from '../components/CustomSelect.vue'

const fileInput = ref<HTMLInputElement | null>(null)
const csvText = ref('')
const csvData = ref<string[][]>([])
const headers = ref<string[]>([])
const isLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(50)
const isDragging = ref(false)
const dragSourceIndex = ref(-1)
const dragOverIndex = ref(-1)
const dragPreview = ref<HTMLElement | null>(null)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragOffsetX = ref(0)
const dragOffsetY = ref(0)
const inputMode = ref<'file' | 'text'>('text')
const fileName = ref('')
const errorMessage = ref('')

// 触摸相关状态
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchStartTime = ref(0)
const touchMoveThreshold = 10 // 触摸移动阈值
const longPressThreshold = 500 // 长按阈值

// 计算用于复制的CSV文本
const csvTextForCopy = computed(() => {
  if (!csvData.value.length) return ''
  return Papa.unparse(csvData.value)
})

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil((csvData.value.length - 1) / Number(pageSize.value))
})

// 计算要显示的页码
const displayedPages = computed(() => {
  const delta = 2
  const range: number[] = []
  const rangeWithDots: number[] = []
  let l: number

  for (let i = 1; i <= totalPages.value; i++) {
    if (
      i === 1 ||
      i === totalPages.value ||
      (i >= currentPage.value - delta && i <= currentPage.value + delta)
    ) {
      range.push(i)
    }
  }

  range.forEach(i => {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1)
      } else if (i - l !== 1) {
        rangeWithDots.push(-1)
      }
    }
    rangeWithDots.push(i)
    l = i
  })

  return rangeWithDots
})

// 获取当前页的数据
const paginatedData = computed(() => {
  const dataWithoutHeaders = csvData.value.slice(1)
  const start = (currentPage.value - 1) * Number(pageSize.value)
  const end = start + Number(pageSize.value)
  return dataWithoutHeaders.slice(start, end)
})

// 获取实际的行索引
const getActualRowIndex = (index: number) => {
  return (currentPage.value - 1) * Number(pageSize.value) + index + 1
}

// 获取列宽度
const getColumnWidth = (_: number) => {
  return 100
}

// 自动调整文本域高度
const autoResize = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement
  if (textarea.id === 'csv-input') return
  textarea.style.height = 'auto'
  textarea.style.height = textarea.scrollHeight + 'px'
}

// 初始化所有文本域高度
const initTextareaHeights = () => {
  const textareas = document.querySelectorAll('textarea')
  textareas.forEach(textarea => {
    if (textarea.id === 'csv-input') return
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'
  })
}

// 监听数据变化，重新计算高度
watch(csvData, () => {
  nextTick(() => {
    initTextareaHeights()
  })
})

// 跳转到指定页
const goToPage = (page: number) => {
  if (page !== -1 && page !== currentPage.value) {
    currentPage.value = page
  }
}

// 处理表头拖拽开始
const handleHeaderDragStart = (event: DragEvent, index: number) => {
  if (!event.dataTransfer) return

  // 设置拖拽数据
  event.dataTransfer.setData('text/plain', index.toString())
  event.dataTransfer.effectAllowed = 'move'

  // 创建拖拽预览元素
  const header = headers.value[index]
  dragPreview.value = document.createElement('div')
  dragPreview.value.className = 'fixed bg-accent-soft text-accent px-4 py-2 rounded shadow-lg pointer-events-none z-50'
  dragPreview.value.textContent = header
  document.body.appendChild(dragPreview.value)

  // 记录拖拽起始位置
  dragStartX.value = event.clientX
  dragStartY.value = event.clientY
  dragOffsetX.value = event.clientX - (dragPreview.value.getBoundingClientRect().left || 0)
  dragOffsetY.value = event.clientY - (dragPreview.value.getBoundingClientRect().top || 0)

  // 更新拖拽状态
  isDragging.value = true
  dragSourceIndex.value = index

  // 添加拖拽移动事件监听
  document.addEventListener('dragover', handleDragMove)
  document.addEventListener('drop', handleDragEnd)
  document.addEventListener('dragend', handleDragEnd)
}

// 处理拖拽移动
const handleDragMove = (event: DragEvent) => {
  if (!dragPreview.value) return

  // 更新预览元素位置
  dragPreview.value.style.left = `${event.clientX - dragOffsetX.value}px`
  dragPreview.value.style.top = `${event.clientY - dragOffsetY.value}px`
}

// 处理拖拽结束
const handleDragEnd = () => {
  // 移除拖拽预览元素
  if (dragPreview.value) {
    document.body.removeChild(dragPreview.value)
    dragPreview.value = null
  }

  // 移除事件监听
  document.removeEventListener('dragover', handleDragMove)
  document.removeEventListener('drop', handleDragEnd)
  document.removeEventListener('dragend', handleDragEnd)

  // 重置拖拽状态
  isDragging.value = false
  dragSourceIndex.value = -1
  dragOverIndex.value = -1
}

// 处理表头拖拽经过
const handleHeaderDragOver = (event: DragEvent, index: number) => {
  event.preventDefault()
  if (index !== dragSourceIndex.value) {
    dragOverIndex.value = index
  }
}

// 处理表头拖拽进入
const handleHeaderDragEnter = (event: DragEvent, index: number) => {
  event.preventDefault()
  if (index !== dragSourceIndex.value) {
    dragOverIndex.value = index
  }
}

// 处理表头拖拽离开
const handleHeaderDragLeave = (event: DragEvent, index: number) => {
  event.preventDefault()
  if (dragOverIndex.value === index) {
    dragOverIndex.value = -1
  }
}

// 处理表头拖拽放置
const handleHeaderDrop = (event: DragEvent, targetIndex: number) => {
  event.preventDefault()
  const sourceIndex = parseInt(event.dataTransfer?.getData('text/plain') || '-1')
  if (sourceIndex === -1 || sourceIndex === targetIndex) return

  // 交换表头
  const tempHeader = headers.value[sourceIndex]
  headers.value[sourceIndex] = headers.value[targetIndex]
  headers.value[targetIndex] = tempHeader

  // 交换数据列
  csvData.value.forEach(row => {
    const temp = row[sourceIndex]
    row[sourceIndex] = row[targetIndex]
    row[targetIndex] = temp
  })
}

// 处理文本输入
const handleTextInput = () => {
  if (!csvText.value) {
    csvData.value = []
    headers.value = []
    return
  }

  try {
    const results = Papa.parse(csvText.value)
    if (results.data.length > 0) {
      const filteredData = results.data.filter((row: unknown) =>
        Array.isArray(row) && row.some(cell => cell !== null && cell !== '')
      ) as string[][]

      headers.value = filteredData[0]
      csvData.value = filteredData
    }
  } catch (error) {
    console.error('Error parsing CSV:', error)
  }
}

const handleCellChange = () => {
  // 可以在这里添加数据验证或其他处理
}

const downloadCsv = () => {
  if (!csvData.value.length) return

  // 生成时间戳
  const now = new Date()
  const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`

  // 生成文件名
  let outputFileName = 'data'
  if (fileName.value) {
    // 提取不带扩展名的文件名
    const nameWithoutExt = fileName.value.replace(/\.[^/.]+$/, "")
    outputFileName = nameWithoutExt
  }

  const finalFileName = `${outputFileName}-${timestamp}.csv`

  const csvContent = Papa.unparse(csvData.value)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = finalFileName
  link.click()
}

// 分页相关方法
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const handlePageSizeChange = () => {
  currentPage.value = 1
  // 确保pageSize是数字类型
  pageSize.value = Number(pageSize.value)
}

const handleCellFocus = (event: FocusEvent) => {
  const cell = (event.target as HTMLElement).closest('td')
  if (cell) {
    cell.style.borderColor = '#6366f1'
    cell.style.zIndex = '10'
  }
}

const handleCellBlur = (event: FocusEvent) => {
  const cell = (event.target as HTMLElement).closest('td')
  if (cell) {
    cell.style.borderColor = ''
    cell.style.zIndex = ''
  }
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 处理文件拖放
const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0]
  if (file && file.type === 'text/csv') {
    handleFileUpload({ target: { files: [file] } } as any)
  }
}

// 处理文件上传
const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  fileName.value = file.name
  isLoading.value = true
  currentPage.value = 1

  if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

        if (jsonData.length > 0) {
          const filteredData = jsonData.filter((row: unknown) =>
            Array.isArray(row) && row.some(cell => cell !== null && cell !== '')
          ) as string[][]

          headers.value = filteredData[0]
          csvData.value = filteredData
        }
        isLoading.value = false
      } catch (error) {
        console.error('Error parsing Excel:', error)
        errorMessage.value = 'Excel解析错误，请检查文件格式'
        isLoading.value = false
      }
    }
    reader.readAsArrayBuffer(file)
  } else {
    Papa.parse(file, {
      complete: (results) => {
        if (results.data.length > 0) {
          const filteredData = results.data.filter((row: unknown) =>
            Array.isArray(row) && row.some(cell => cell !== null && cell !== '')
          ) as string[][]

          headers.value = filteredData[0]
          csvData.value = filteredData
        }
        isLoading.value = false
      },
      error: (error) => {
        console.error('Error parsing CSV:', error)
        errorMessage.value = 'CSV解析错误，请检查文件格式'
        isLoading.value = false
      }
    })
  }
}

// 导出为Excel
const downloadExcel = () => {
  if (!csvData.value.length) return

  // 生成时间戳
  const now = new Date()
  const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`

  // 生成文件名
  let outputFileName = 'data'
  if (fileName.value) {
    // 提取不带扩展名的文件名
    const nameWithoutExt = fileName.value.replace(/\.[^/.]+$/, "")
    outputFileName = nameWithoutExt
  }

  const finalFileName = `${outputFileName}-${timestamp}.xlsx`

  // 创建工作簿
  const wb = XLSX.utils.book_new()

  // 将CSV数据转换为工作表
  const ws = XLSX.utils.aoa_to_sheet(csvData.value)

  // 将工作表添加到工作簿
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

  // 导出文件
  XLSX.writeFile(wb, finalFileName)
}

// 处理触摸开始
const handleTouchStart = (event: TouchEvent, index: number) => {
  touchStartX.value = event.touches[0].clientX
  touchStartY.value = event.touches[0].clientY
  touchStartTime.value = Date.now()

  // 模拟长按事件
  setTimeout(() => {
    if (Date.now() - touchStartTime.value >= longPressThreshold) {
      handleHeaderDragStart(event as any, index)
    }
  }, longPressThreshold)
}

// 处理触摸移动
const handleTouchMove = (event: TouchEvent, index: number) => {
  const touch = event.touches[0]
  const deltaX = touch.clientX - touchStartX.value
  const deltaY = touch.clientY - touchStartY.value

  if (Math.abs(deltaX) > touchMoveThreshold || Math.abs(deltaY) > touchMoveThreshold) {
    handleHeaderDragOver(event as any, index)
  }
}

// 处理触摸结束
const handleTouchEnd = () => {
  handleDragEnd()
}
</script>

<style scoped>
.overflow-x-auto {
  max-height: calc(100vh - 200px);
  overflow: auto;
  width: 100%;
}

table {
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  width: 100%;
}

thead {
  position: sticky;
  top: 0;
  z-index: 10;
}

th {
  border: 1px solid var(--border) !important;
  position: relative;
  box-sizing: border-box;
  padding: 0 !important;
  vertical-align: middle;
  overflow: visible;
  transition: background-color 0.2s, transform 0.2s;
  background-color: var(--bg-tertiary);
}

th.dragging {
  background-color: var(--accent-soft) !important;
  transform: scale(1.02);
  z-index: 10;
}

th.drag-over {
  background-color: var(--accent-soft) !important;
  transform: scale(1.02);
  z-index: 10;
  border-color: var(--accent) !important;
}

th > div {
  padding: 4px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  transition: opacity 0.2s;
}

th.dragging > div {
  opacity: 0.5;
}

td {
  border-top: 1px solid var(--border) !important;
  border-right: 1px solid var(--border) !important;
  border-bottom: 1px solid var(--border) !important;
  border-left: 1px solid var(--border) !important;
  position: relative;
  box-sizing: border-box;
  padding: 0 !important;
  transition: border-color 0.2s;
  min-height: 24px;
}

td:focus-within {
  border-top: 2px solid var(--accent) !important;
  border-right: 2px solid var(--accent) !important;
  border-bottom: 2px solid var(--accent) !important;
  border-left: 2px solid var(--accent) !important;
  box-shadow: 0 0 0 1px var(--accent-soft);
  z-index: 2;
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

/* 表格内单元格 textarea */
td textarea, td input[type="text"] {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  overflow: hidden;
  box-sizing: border-box;
  font-size: 0.875rem;
  background-color: transparent !important;
  padding: 0;
  margin: 0;
  white-space: pre;
  word-wrap: normal;
  word-break: normal;
  font-family: inherit;
}

td textarea:focus, td input[type="text"]:focus {
  background-color: transparent !important;
}

.cell-textarea {
  display: block;
  width: 100%;
  height: 100%;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .overflow-x-auto {
    max-height: calc(100vh - 300px);
  }

  table {
    font-size: 0.75rem;
  }

  th, td {
    padding: 0.25rem !important;
  }

  textarea {
    font-size: 0.75rem;
    padding: 0.25rem !important;
  }
}

/* 触摸优化 */
th {
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
}

td {
  -webkit-tap-highlight-color: transparent;
}

textarea {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* 防止移动端双击缩放 */
* {
  touch-action: manipulation;
}
</style>
