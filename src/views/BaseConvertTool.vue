<script setup lang="ts">
import { ref, computed } from 'vue'
import ToolCard from '../components/ToolCard.vue'
import CopyButton from '../components/CopyButton.vue'
import { Binary, Settings2, ArrowRightLeft, AlertCircle, Info } from 'lucide-vue-next'

// ===== 进制选项 =====
const bases = [
  { value: 2, label: '二进制 (2)' },
  { value: 8, label: '八进制 (8)' },
  { value: 10, label: '十进制 (10)' },
  { value: 16, label: '十六进制 (16)' },
]

// ===== 状态 =====
const inputValue = ref('')
const sourceBase = ref(10)
const customBase = ref(10)
const useCustomBase = ref(false)
const uppercaseHex = ref(true)
const error = ref('')

// ===== 有效源进制 =====
const effectiveSourceBase = computed(() => {
  return useCustomBase.value ? customBase.value : sourceBase.value
})

// ===== 验证输入字符 =====
function isValidDigit(char: string, base: number): boolean {
  if (base <= 10) {
    return char >= '0' && char < String(base)
  }
  const lowerChar = char.toLowerCase()
  const digit = lowerChar >= '0' && lowerChar <= '9'
    ? parseInt(lowerChar)
    : lowerChar >= 'a' && lowerChar <= 'z'
      ? lowerChar.charCodeAt(0) - 'a'.charCodeAt(0) + 10
      : -1
  return digit >= 0 && digit < base
}

// ===== 解析输入为十进制 =====
function parseInput(value: string, base: number): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  // 去除常见前缀
  let cleaned = trimmed
  if (cleaned.startsWith('0x') || cleaned.startsWith('0X')) {
    cleaned = cleaned.slice(2)
  } else if (cleaned.startsWith('0b') || cleaned.startsWith('0B')) {
    cleaned = cleaned.slice(2)
  } else if (cleaned.startsWith('0o') || cleaned.startsWith('0O')) {
    cleaned = cleaned.slice(2)
  }

  // 去除下划线分隔符
  cleaned = cleaned.replace(/_/g, '')

  if (!cleaned) return null

  // 验证每个字符
  for (const char of cleaned) {
    if (!isValidDigit(char, base)) {
      return null
    }
  }

  try {
    const result = parseInt(cleaned, base)
    if (isNaN(result)) return null
    return result
  } catch {
    return null
  }
}

// ===== 转换结果 =====
const decimalValue = computed<number | null>(() => {
  error.value = ''
  if (!inputValue.value.trim()) return null

  const result = parseInput(inputValue.value, effectiveSourceBase.value)
  if (result === null) {
    error.value = `输入包含无效字符，当前进制为 ${effectiveSourceBase.value}`
    return null
  }
  return result
})

// ===== 各进制结果 =====
function convertToBase(num: number, base: number): string {
  try {
    const result = num.toString(base)
    return uppercaseHex.value ? result.toUpperCase() : result.toLowerCase()
  } catch {
    return '-'
  }
}

const results = computed(() => {
  if (decimalValue.value === null) return null

  const num = decimalValue.value
  return {
    bin: convertToBase(num, 2),
    oct: convertToBase(num, 8),
    dec: convertToBase(num, 10),
    hex: convertToBase(num, 16),
  }
})

// ===== 自定义进制结果 =====
const customResult = computed(() => {
  if (decimalValue.value === null || useCustomBase.value) return null
  if (customBase.value === 2 || customBase.value === 8 || customBase.value === 10 || customBase.value === 16) {
    return null // 已经在标准结果中显示
  }
  return convertToBase(decimalValue.value, customBase.value)
})

// ===== 交换进制 =====
function swapBase(base: number) {
  if (decimalValue.value === null) return
  inputValue.value = decimalValue.value.toString(base)
  sourceBase.value = base
  useCustomBase.value = false
}
</script>

<template>
  <ToolCard title="进制转换" description="支持二进制、八进制、十进制、十六进制及任意 2-36 进制的实时互转">

    <div class="space-y-6">

      <!-- ===== 输入区 ===== -->
      <section>
        <h2 class="text-sm font-semibold text-content-secondary mb-3 flex items-center gap-1.5">
          <Settings2 class="h-4 w-4" />
          输入设置
        </h2>

        <div class="rounded-[12px] border border-line p-4 bg-surface-secondary">
          <div class="flex flex-col sm:flex-row sm:items-end gap-4">
            <!-- 输入值 -->
            <div class="flex-1 min-w-0">
              <label class="label-text">数值</label>
              <input
                v-model="inputValue"
                type="text"
                class="input-field font-mono mt-1"
                placeholder="输入要转换的数值，如 255、FF、11111111"
              />
            </div>

            <!-- 源进制选择 -->
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  v-model="useCustomBase"
                  class="rounded accent-[var(--accent)]"
                />
                <span class="text-sm text-content-secondary">自定义进制</span>
              </label>
            </div>
          </div>

          <!-- 进制选择 -->
          <div class="mt-4 flex flex-col sm:flex-row gap-4">
            <!-- 标准进制 -->
            <div v-if="!useCustomBase" class="flex flex-wrap gap-2">
              <button
                v-for="base in bases"
                :key="base.value"
                @click="sourceBase = base.value"
                :class="[
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  sourceBase === base.value
                    ? 'bg-accent-soft text-accent ring-1 ring-inset ring-accent/30'
                    : 'bg-surface-primary text-content-secondary hover:bg-surface-secondary ring-1 ring-inset ring-line'
                ]"
              >
                {{ base.label }}
              </button>
            </div>

            <!-- 自定义进制 -->
            <div v-else class="flex items-center gap-3">
              <label class="label-text whitespace-nowrap">进制 (2-36)</label>
              <input
                v-model.number="customBase"
                type="number"
                min="2"
                max="36"
                class="input-field w-20 font-mono"
              />
            </div>
          </div>

          <!-- 错误提示 -->
          <div v-if="error" class="mt-3 flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle class="h-3.5 w-3.5 shrink-0" />
            {{ error }}
          </div>
        </div>
      </section>

      <!-- ===== 转换结果 ===== -->
      <section v-if="results">
        <h2 class="text-sm font-semibold text-content-secondary mb-3 flex items-center gap-1.5">
          <Binary class="h-4 w-4" />
          转换结果
        </h2>

        <div class="rounded-[12px] border border-line overflow-hidden divide-y divide-line">
          <!-- 二进制 -->
          <div class="flex items-center justify-between px-4 py-3 bg-surface-primary hover:bg-surface-secondary transition-colors">
            <div class="flex items-center gap-3 min-w-0">
              <span class="text-xs font-medium text-content-tertiary w-20 shrink-0">二进制 (2)</span>
              <span class="font-mono text-sm text-content-primary break-all select-all">{{ results.bin }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0 ml-2">
              <button
                @click="swapBase(2)"
                class="p-1.5 rounded-lg text-content-tertiary hover:text-accent hover:bg-accent-soft transition-colors"
                title="以此进制为输入"
              >
                <ArrowRightLeft class="h-3.5 w-3.5" />
              </button>
              <CopyButton :text="results.bin" label="" size="sm" />
            </div>
          </div>

          <!-- 八进制 -->
          <div class="flex items-center justify-between px-4 py-3 bg-surface-primary hover:bg-surface-secondary transition-colors">
            <div class="flex items-center gap-3 min-w-0">
              <span class="text-xs font-medium text-content-tertiary w-20 shrink-0">八进制 (8)</span>
              <span class="font-mono text-sm text-content-primary break-all select-all">{{ results.oct }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0 ml-2">
              <button
                @click="swapBase(8)"
                class="p-1.5 rounded-lg text-content-tertiary hover:text-accent hover:bg-accent-soft transition-colors"
                title="以此进制为输入"
              >
                <ArrowRightLeft class="h-3.5 w-3.5" />
              </button>
              <CopyButton :text="results.oct" label="" size="sm" />
            </div>
          </div>

          <!-- 十进制 -->
          <div class="flex items-center justify-between px-4 py-3 bg-surface-primary hover:bg-surface-secondary transition-colors">
            <div class="flex items-center gap-3 min-w-0">
              <span class="text-xs font-medium text-content-tertiary w-20 shrink-0">十进制 (10)</span>
              <span class="font-mono text-sm text-content-primary break-all select-all">{{ results.dec }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0 ml-2">
              <button
                @click="swapBase(10)"
                class="p-1.5 rounded-lg text-content-tertiary hover:text-accent hover:bg-accent-soft transition-colors"
                title="以此进制为输入"
              >
                <ArrowRightLeft class="h-3.5 w-3.5" />
              </button>
              <CopyButton :text="results.dec" label="" size="sm" />
            </div>
          </div>

          <!-- 十六进制 -->
          <div class="flex items-center justify-between px-4 py-3 bg-surface-primary hover:bg-surface-secondary transition-colors">
            <div class="flex items-center gap-3 min-w-0">
              <span class="text-xs font-medium text-content-tertiary w-20 shrink-0">十六进制 (16)</span>
              <span class="font-mono text-sm text-content-primary break-all select-all">{{ results.hex }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0 ml-2">
              <button
                @click="swapBase(16)"
                class="p-1.5 rounded-lg text-content-tertiary hover:text-accent hover:bg-accent-soft transition-colors"
                title="以此进制为输入"
              >
                <ArrowRightLeft class="h-3.5 w-3.5" />
              </button>
              <CopyButton :text="results.hex" label="" size="sm" />
            </div>
          </div>

          <!-- 自定义进制结果 -->
          <div v-if="customResult" class="flex items-center justify-between px-4 py-3 bg-surface-primary hover:bg-surface-secondary transition-colors">
            <div class="flex items-center gap-3 min-w-0">
              <span class="text-xs font-medium text-content-tertiary w-20 shrink-0">自定义 ({{ customBase }})</span>
              <span class="font-mono text-sm text-content-primary break-all select-all">{{ customResult }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0 ml-2">
              <button
                @click="swapBase(customBase)"
                class="p-1.5 rounded-lg text-content-tertiary hover:text-accent hover:bg-accent-soft transition-colors"
                title="以此进制为输入"
              >
                <ArrowRightLeft class="h-3.5 w-3.5" />
              </button>
              <CopyButton :text="customResult" label="" size="sm" />
            </div>
          </div>
        </div>
      </section>

      <!-- ===== 空状态 ===== -->
      <div v-else-if="!error" class="text-center py-12 text-content-tertiary">
        <Binary class="h-10 w-10 mx-auto mb-2 opacity-40" />
        <p class="text-sm">输入数值即可实时转换</p>
      </div>

      <!-- ===== 使用说明 ===== -->
      <div class="rounded-[12px] bg-surface-secondary border border-line p-4">
        <h3 class="text-xs font-semibold text-content-secondary mb-2 flex items-center gap-1.5">
          <Info class="h-3.5 w-3.5" />
          使用说明
        </h3>
        <ul class="text-xs text-content-tertiary space-y-1">
          <li>• 支持 2-36 任意进制之间的转换</li>
          <li>• 自动识别 <span class="font-mono">0x</span>、<span class="font-mono">0b</span>、<span class="font-mono">0o</span> 前缀</li>
          <li>• 支持下划线分隔符，如 <span class="font-mono">1_000_000</span></li>
          <li>• 点击 <ArrowRightLeft class="h-3 w-3 inline" /> 可将结果作为新的输入</li>
          <li>• 十六进制字母支持大小写切换</li>
        </ul>
      </div>

    </div>
  </ToolCard>
</template>
