<script setup lang="ts">
import { ref, computed } from 'vue'
import ToolCard from '../components/ToolCard.vue'
import CopyButton from '../components/CopyButton.vue'
import { ArrowLeftRight, FileJson, FileText, Eraser, FileCode, AlignLeft, Minus } from 'lucide-vue-next'
import { jsonToYaml, yamlToJson, jsonExample, yamlExample } from '../utils/yaml'

type Direction = 'json-to-yaml' | 'yaml-to-json'
type JsonIndent = 2 | 4

const direction = ref<Direction>('json-to-yaml')
const input = ref('')
const output = ref('')
const errorMsg = ref('')
const jsonIndent = ref<JsonIndent>(2)
const autoConvert = ref(true)
const spinning = ref(false)

const isJsonToYaml = computed(() => direction.value === 'json-to-yaml')
const inputLabel = computed(() => isJsonToYaml.value ? 'JSON 输入' : 'YAML 输入')
const outputLabel = computed(() => isJsonToYaml.value ? 'YAML 输出' : 'JSON 输出')
const inputPlaceholder = computed(() =>
  isJsonToYaml.value ? '粘贴 JSON 内容...' : '粘贴 YAML 内容...'
)

function convert() {
  errorMsg.value = ''
  output.value = ''

  const trimmed = input.value.trim()
  if (!trimmed) return

  try {
    if (direction.value === 'json-to-yaml') {
      output.value = jsonToYaml(trimmed, 2)
    } else {
      output.value = yamlToJson(trimmed, true)
    }
  } catch (e: any) {
    errorMsg.value = e.message || '转换失败，请检查输入格式'
  }
}

function handleInput() {
  if (autoConvert.value) {
    convert()
  }
}

function switchDirection() {
  spinning.value = true
  setTimeout(() => { spinning.value = false }, 400)

  direction.value = isJsonToYaml.value ? 'yaml-to-json' : 'json-to-yaml'

  // If there's output, swap it to input
  if (output.value) {
    input.value = output.value
    convert()
  }
}

function swapContent() {
  if (!output.value) return
  const tmp = input.value
  input.value = output.value
  output.value = tmp
  convert()
}

function formatJson(pretty: boolean) {
  errorMsg.value = ''
  try {
    const obj = JSON.parse(input.value)
    input.value = JSON.stringify(obj, null, pretty ? jsonIndent.value : 0)
    convert()
  } catch (e: any) {
    errorMsg.value = 'JSON 格式错误: ' + (e.message || '')
  }
}

function loadExample() {
  if (direction.value === 'json-to-yaml') {
    input.value = jsonExample
  } else {
    input.value = yamlExample
  }
  convert()
}

function clearAll() {
  input.value = ''
  output.value = ''
  errorMsg.value = ''
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const file = e.dataTransfer?.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    input.value = reader.result as string
    convert()
  }
  reader.readAsText(file)
}
</script>

<template>
  <ToolCard
    title="JSON YAML 转换"
    description="JSON 与 YAML 在线互转工具，支持格式化、压缩、错误定位"
  >
    <!-- Controls -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <!-- Direction toggle -->
      <button
        class="btn-secondary !px-2.5 !py-1 text-xs flex items-center gap-2"
        @click="switchDirection"
        title="切换转换方向"
      >
        <span class="font-medium">
          {{ isJsonToYaml ? 'JSON → YAML' : 'YAML → JSON' }}
        </span>
        <ArrowLeftRight
          class="w-4 h-4 transition-transform duration-400"
          :class="{ 'rotate-180': spinning }"
        />
      </button>

      <!-- Auto convert toggle -->
      <label class="flex items-center gap-1.5 text-xs cursor-pointer select-none">
        <input
          type="checkbox"
          v-model="autoConvert"
          class="w-3.5 h-3.5 rounded accent-[var(--accent)]"
        />
        <span class="text-content-secondary">自动转换</span>
      </label>

      <!-- JSON formatting (only for JSON mode) -->
      <template v-if="direction === 'json-to-yaml'">
        <div class="h-5 w-px bg-line"></div>
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-content-tertiary">JSON 格式化:</span>
          <button class="btn-secondary !px-2.5 !py-1 text-xs" @click="formatJson(true)">
            <AlignLeft class="w-3.5 h-3.5 mr-1 inline" />美化
          </button>
          <button class="btn-secondary !px-2.5 !py-1 text-xs" @click="formatJson(false)">
            <Minus class="w-3.5 h-3.5 mr-1 inline" />压缩
          </button>
          <select
            v-model="jsonIndent"
            class="select-field !w-auto !py-1 !pr-8 !text-xs"
          >
            <option :value="2">2 空格</option>
            <option :value="4">4 空格</option>
          </select>
        </div>
      </template>

      <div class="flex-1"></div>

      <!-- Action buttons -->
      <button class="btn-secondary !px-2.5 !py-1 text-xs" @click="loadExample" title="加载示例数据">
        <FileCode class="w-3.5 h-3.5 mr-1 inline" />示例
      </button>
      <button class="btn-secondary !px-2.5 !py-1 text-xs" @click="clearAll" title="清空所有">
        <Eraser class="w-4 h-4 mr-1 inline" />清空
      </button>
    </div>

    <!-- Editor area -->
    <div class="flex flex-col lg:flex-row gap-3 min-h-0">
      <!-- Input panel -->
      <div class="flex-1 flex flex-col min-w-0">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <component
              :is="isJsonToYaml ? FileJson : FileText"
              class="w-4 h-4 text-content-tertiary shrink-0"
            />
            <span class="text-sm font-medium text-content-secondary">{{ inputLabel }}</span>
          </div>
          <div class="flex gap-1.5">
            <button
              class="btn-secondary !px-2.5 !py-1 text-xs"
              @click="swapContent"
              :disabled="!output"
              :title="output ? '交换输入输出' : '先转换后再交换'"
            >
              <ArrowLeftRight class="w-3 h-3 mr-1 inline" />交换
            </button>
          </div>
        </div>
        <textarea
          v-model="input"
          class="textarea-field flex-1 font-mono text-sm min-h-[280px] lg:min-h-[400px] resize-y"
          :placeholder="inputPlaceholder"
          spellcheck="false"
          @input="handleInput"
          @drop="handleDrop"
          @dragover.prevent
        ></textarea>
        <p v-if="errorMsg" class="text-sm text-red-500 mt-1.5 leading-relaxed">
          {{ errorMsg }}
        </p>
      </div>

      <!-- Output panel -->
      <div class="flex-1 flex flex-col min-w-0">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <component
              :is="isJsonToYaml ? FileText : FileJson"
              class="w-4 h-4 text-content-tertiary shrink-0"
            />
            <span class="text-sm font-medium text-content-secondary">{{ outputLabel }}</span>
          </div>
          <CopyButton v-if="output" :text="output" label="复制" size="sm" />
        </div>
        <textarea
          :value="output"
          class="textarea-field flex-1 font-mono text-sm min-h-[280px] lg:min-h-[400px] resize-y bg-surface-tertiary"
          readonly
          placeholder="转换结果将在此显示..."
          spellcheck="false"
        ></textarea>
      </div>
    </div>
  </ToolCard>
</template>
