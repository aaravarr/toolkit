<template>
  <ToolCard title="文档分割与合并工具" description="支持多种分隔符的文本分割与合并工具">
    <div class="space-y-6">
      <!-- 输入文本 -->
      <div>
        <label class="label-text">输入文本</label>
        <textarea
          v-model="inputText"
          rows="8"
          class="textarea-field"
          placeholder="请输入要分割的文本"
        ></textarea>
      </div>

      <!-- 分隔符选择 -->
      <div>
        <label class="label-text">选择分隔符</label>
        <div class="flex flex-col gap-2">
          <CustomSelect v-model="selectedDelimiter" :options="delimiterOptions" />
          <textarea
            v-if="selectedDelimiter === 'custom'"
            v-model="customDelimiter"
            rows="1"
            class="textarea-field"
            placeholder="输入自定义分隔符"
          ></textarea>
        </div>
      </div>

      <!-- 分割结果 -->
      <div>
        <div class="flex items-center justify-between">
          <label class="label-text">分割结果</label>
          <button
            v-if="splitResult.length > 10"
            @click="showAllResults = !showAllResults"
            class="btn-sm cursor-pointer"
          >
            {{ showAllResults ? '收起' : '展开全部' }}
          </button>
        </div>
        <div class="overflow-hidden rounded-lg border border-line bg-surface-primary">
          <div v-if="splitResult.length === 0" class="flex flex-col items-center justify-center py-8 px-4">
            <Copy class="h-10 w-10 text-content-tertiary" />
            <h3 class="mt-2 text-sm font-medium text-content-primary">暂无数据</h3>
            <p class="mt-1 text-sm text-content-secondary">请输入文本</p>
          </div>
          <div v-else>
            <table class="min-w-full divide-y divide-line">
              <thead class="bg-surface-secondary">
                <tr>
                  <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">#</th>
                  <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">内容</th>
                </tr>
              </thead>
              <tbody class="bg-surface-primary divide-y divide-line">
                <tr v-for="(item, index) in displayedResults" :key="index" class="hover:bg-surface-secondary">
                  <td class="px-3 py-2 whitespace-nowrap text-xs text-content-secondary">{{ index + 1 }}</td>
                  <td class="px-3 py-2 text-xs text-content-primary font-mono">{{ item }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="splitResult.length > 10 && !showAllResults" class="text-center py-2 bg-surface-secondary text-xs text-content-secondary">
              共 {{ splitResult.length }} 条数据，点击"展开全部"查看更多
            </div>
          </div>
        </div>
      </div>

      <!-- 合并操作（仅在分割后有结果时显示） -->
      <div v-if="splitResult.length > 0">
        <div class="border-t border-line pt-6">
          <h4 class="text-base font-semibold leading-6 text-content-primary">合并操作</h4>
          <p class="mt-1 text-sm text-content-secondary">设置合并参数</p>

          <!-- 合并设置 -->
          <div class="mt-4 space-y-4">
            <!-- 常用模板 -->
            <div class="flex flex-wrap gap-2">
              <button
                v-for="(template, name) in mergeTemplates"
                :key="name"
                @click="applyTemplate(template)"
                class="btn-secondary !px-2.5 !py-1.5 !text-xs cursor-pointer"
              >
                {{ name }}
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="label-text">前缀</label>
                <input
                  v-model="prefix"
                  type="text"
                  class="input-field"
                  placeholder="输入前缀"
                >
              </div>
              <div>
                <label class="label-text">后缀</label>
                <input
                  v-model="suffix"
                  type="text"
                  class="input-field"
                  placeholder="输入后缀"
                >
              </div>
              <div class="relative">
                <label class="label-text">间隔符</label>
                <textarea
                  v-model="separator"
                  rows="1"
                  class="textarea-field"
                  placeholder="输入间隔符（支持多行）"
                ></textarea>
                <div class="absolute right-0 top-0 flex flex-row gap-1">
                  <button
                    @click="toggleQuotes('double')"
                    :class="[
                      'inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold shadow-sm ring-1 ring-inset cursor-pointer',
                      hasDoubleQuotes ? 'btn-primary !ring-0' : 'btn-secondary !ring-line'
                    ]"
                  >
                    "
                  </button>
                  <button
                    @click="toggleQuotes('single')"
                    :class="[
                      'inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold shadow-sm ring-1 ring-inset cursor-pointer',
                      hasSingleQuotes ? 'btn-primary !ring-0' : 'btn-secondary !ring-line'
                    ]"
                  >
                    '
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 合并结果 -->
          <div class="mt-4">
            <div class="flex items-center justify-between">
              <label class="label-text">合并结果</label>
              <CopyButton v-if="mergedText" :text="mergedText" label="复制" size="sm" />
            </div>
            <textarea
              v-model="mergedText"
              rows="8"
              class="textarea-field"
              readonly
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  </ToolCard>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Copy } from 'lucide-vue-next'
import ToolCard from '../components/ToolCard.vue'
import CopyButton from '../components/CopyButton.vue'
import CustomSelect from '../components/CustomSelect.vue'

const delimiterOptions = [
  { label: '换行符', value: '\\n' },
  { label: '逗号', value: ',' },
  { label: '分号', value: ';' },
  { label: '空格', value: ' ' },
  { label: '制表符', value: '\\t' },
  { label: '自定义', value: 'custom' },
]

const selectedDelimiter = ref('\\n')
const customDelimiter = ref('')
const inputText = ref('')
const prefix = ref('')
const suffix = ref('')
const separator = ref('')
const splitResult = ref<string[]>([])
const mergedText = ref('')
const showAllResults = ref(false)
const hasDoubleQuotes = ref(false)
const hasSingleQuotes = ref(false)

const actualDelimiter = computed(() => {
  if (selectedDelimiter.value === 'custom') {
    return customDelimiter.value
  }
  // 处理特殊字符
  if (selectedDelimiter.value === '\\n') return '\n'
  if (selectedDelimiter.value === '\\t') return '\t'
  return selectedDelimiter.value
})

const actualSeparator = computed(() => {
  return separator.value
})

const displayedResults = computed(() => {
  if (showAllResults.value) return splitResult.value
  return splitResult.value.slice(0, 10)
})

// 监听输入变化，实时更新分割结果
watch([inputText, selectedDelimiter, customDelimiter], () => {
  if (!inputText.value) {
    splitResult.value = []
    mergedText.value = ''
    return
  }
  splitResult.value = inputText.value.split(actualDelimiter.value).filter(item => item.trim() !== '')
  updateMergedText()
})

// 监听合并参数变化，实时更新合并结果
watch([splitResult, prefix, suffix, actualSeparator], () => {
  updateMergedText()
})

const updateMergedText = () => {
  if (splitResult.value.length === 0) {
    mergedText.value = ''
    return
  }
  mergedText.value = prefix.value + splitResult.value.join(actualSeparator.value) + suffix.value
}

// 添加合并参数模板
const mergeTemplates = {
  'Golang Slice': { prefix: '[]string{', suffix: '}', separator: ', ' },
  'Python List': { prefix: '[', suffix: ']', separator: ', ' },
  'JavaScript Array': { prefix: '[', suffix: ']', separator: ', ' },
  'Java Array': { prefix: '{', suffix: '}', separator: ', ' },
  'C# Array': { prefix: '{', suffix: '}', separator: ', ' },
  'PHP Array': { prefix: '[', suffix: ']', separator: ', ' },
  'Ruby Array': { prefix: '[', suffix: ']', separator: ', ' },
  'Rust Vec': { prefix: 'vec![', suffix: ']', separator: ', ' },
  'SQL IN': { prefix: '(', suffix: ')', separator: ', ' },
  'CSV': { prefix: '', suffix: '', separator: ',' }
}

// 切换引号
const toggleQuotes = (type: 'single' | 'double') => {
  const quote = type === 'single' ? "'" : '"'
  const hasQuotes = type === 'single' ? hasSingleQuotes : hasDoubleQuotes
  const otherHasQuotes = type === 'single' ? hasDoubleQuotes : hasSingleQuotes

  // 如果当前类型的引号已存在，则移除
  if (hasQuotes.value) {
    // 检查前缀和后缀是否以当前引号开始和结束
    if (prefix.value.endsWith(quote) && suffix.value.startsWith(quote)) {
      // 删除引号
      prefix.value = prefix.value.slice(0, -1)
      suffix.value = suffix.value.slice(1)

      // 检查间隔符是否被当前引号包围
      if (separator.value.startsWith(quote) && separator.value.endsWith(quote)) {
        separator.value = separator.value.slice(1, -1)
      }

      hasQuotes.value = false
    }
  } else {
    // 如果另一种类型的引号存在，先检查并移除它
    if (otherHasQuotes.value) {
      const otherQuote = type === 'single' ? '"' : "'"

      // 检查前缀和后缀是否以另一种引号开始和结束
      if (prefix.value.endsWith(otherQuote) && suffix.value.startsWith(otherQuote)) {
        prefix.value = prefix.value.slice(0, -1)
        suffix.value = suffix.value.slice(1)

        // 检查间隔符是否被另一种引号包围
        if (separator.value.startsWith(otherQuote) && separator.value.endsWith(otherQuote)) {
          separator.value = separator.value.slice(1, -1)
        }

        if (type === 'single') {
          hasDoubleQuotes.value = false
        } else {
          hasSingleQuotes.value = false
        }
      }
    }

    // 添加当前类型的引号
    prefix.value = prefix.value + quote
    suffix.value = quote + suffix.value
    separator.value = quote + separator.value + quote
    hasQuotes.value = true
  }
}

// 修改应用模板函数，重置引号状态
const applyTemplate = (template: { prefix: string, suffix: string, separator: string }) => {
  prefix.value = template.prefix
  suffix.value = template.suffix
  separator.value = template.separator
  hasDoubleQuotes.value = false
  hasSingleQuotes.value = false
}
</script>
