<script setup lang="ts">
import { ref, watch } from 'vue'
import ToolCard from '../components/ToolCard.vue'
import ErrorAlert from '../components/ErrorAlert.vue'
import { File, Info } from 'lucide-vue-next'

const jsonInput = ref('')
const jsonData = ref<any[]>([])
const headers = ref<string[]>([])
const error = ref('')
const jsonHistory = ref<string[]>([])

const handleCellDoubleClick = (content: any) => {
  try {
    let newContent = ''
    
    // 如果内容是对象或数组，转换为 JSON 字符串
    if (typeof content === 'object' && content !== null) {
      newContent = JSON.stringify(content, null, 2)
    } else {
      // 尝试解析内容是否为 JSON 字符串
      const parsed = JSON.parse(content)
      // 只有当解析后的内容是对象或数组时才更新
      if (typeof parsed === 'object' && parsed !== null) {
        newContent = JSON.stringify(parsed, null, 2)
      }
    }
    
    // 只有当成功获取到新内容时才更新
    if (newContent) {
      // 保存当前内容到历史记录
      jsonHistory.value.push(jsonInput.value)
      jsonInput.value = newContent
    }
  } catch (e) {
    // 如果不是 JSON 或不是对象/数组，不做任何处理
  }
}

const goBack = () => {
  if (jsonHistory.value.length > 0) {
    jsonInput.value = jsonHistory.value.pop() || ''
  }
}

watch(jsonInput, (newValue) => {
  try {
    if (!newValue) {
      jsonData.value = []
      headers.value = []
      error.value = ''
      return
    }
    
    const parsed = JSON.parse(newValue)
    if (Array.isArray(parsed)) {
      jsonData.value = parsed
      if (parsed.length > 0) {
        headers.value = Object.keys(parsed[0])
      }
    } else if (typeof parsed === 'object' && parsed !== null) {
      // 如果是单个对象，转换为数组形式
      jsonData.value = [parsed]
      headers.value = Object.keys(parsed)
    } else {
      throw new Error('请输入有效的 JSON 数组或对象')
    }
    error.value = ''
  } catch (e) {
    error.value = '请输入有效的 JSON 格式'
    jsonData.value = []
    headers.value = []
  }
})
</script>

<template>
  <ToolCard title="JSON 表格" description="将 JSON 数组转换为表格格式">
    <div class="space-y-6">
      <div class="space-y-4">
        <div>
          <label for="json-input" class="label-text">JSON 数据</label>
          <div class="mt-1 relative rounded-md shadow-sm">
            <textarea
              id="json-input"
              v-model="jsonInput"
              rows="10"
              class="textarea-field"
              placeholder='[{"name": "张三", "age": 25}, {"name": "李四", "age": 30}]'
            ></textarea>
          </div>
          <ErrorAlert v-if="error" :message="error" class="mt-4" />
        </div>
      </div>

      <div class="overflow-hidden rounded-lg border border-line bg-surface-primary shadow">
        <div v-if="jsonData.length === 0" class="flex flex-col items-center justify-center py-12 px-4">
          <File class="h-12 w-12 text-content-tertiary" />
          <h3 class="mt-2 text-sm font-medium text-content-primary">暂无数据</h3>
          <p class="mt-1 text-sm text-content-secondary">请输入有效的 JSON 数组来生成表格</p>
        </div>
        <div v-else>
          <div class="bg-accent-soft border-b border-line px-6 py-3 text-sm text-accent flex items-center justify-between">
            <div class="flex items-center">
              <Info class="h-5 w-5 mr-2 text-accent" />
              <p>提示：双击表格中的单元格可以继续解析其中的 JSON 内容</p>
            </div>
            <button
              @click="goBack"
              :disabled="jsonHistory.length === 0"
              class="btn-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              返回上级
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-line">
              <thead class="bg-surface-secondary">
                <tr>
                  <th
                    v-for="header in headers"
                    :key="header"
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-content-secondary uppercase tracking-wider"
                  >
                    {{ header }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-surface-primary divide-y divide-line">
                <tr v-for="(row, index) in jsonData" :key="index" class="hover:bg-surface-secondary">
                  <td
                    v-for="header in headers"
                    :key="header"
                    class="px-6 py-4 whitespace-pre-wrap text-sm text-content-secondary cursor-pointer hover:bg-surface-tertiary font-mono"
                    @dblclick="handleCellDoubleClick(row[header])"
                  >
                    {{ row[header] }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </ToolCard>
</template> 