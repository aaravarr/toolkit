<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ToolCard from '../components/ToolCard.vue'
import CopyButton from '../components/CopyButton.vue'
import {
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Settings2,
} from 'lucide-vue-next'

// ===== 配置 =====
const length = ref(16)
const count = ref(1)
const useUpper = ref(true)
const useLower = ref(true)
const useDigit = ref(true)
const useSymbol = ref(true)
const excludeAmbiguous = ref(false)
const startWithLetter = ref(false)
const noRepeat = ref(false)
const noConsecutive = ref(false)
const customSymbol = ref('!@#$%^&*()_+-=[]{}|;:,.<>?')
const useCustomSymbol = ref(false)

// ===== 字符集 =====
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const DIGIT = '0123456789'
const AMBIGUOUS = 'iIlL1oO0'

function getCharSet(): string {
  let chars = ''
  if (useUpper.value) chars += UPPER
  if (useLower.value) chars += LOWER
  if (useDigit.value) chars += DIGIT
  if (useSymbol.value) {
    chars += useCustomSymbol.value ? customSymbol.value : '!@#$%^&*()_+-=[]{}|;:,.<>?'
  }
  if (excludeAmbiguous.value) {
    chars = chars.split('').filter(c => !AMBIGUOUS.includes(c)).join('')
  }
  return chars
}

// ===== 安全随机数生成 =====
function secureRandom(max: number): number {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return array[0] % max
}

// ===== 密码生成 =====
const passwords = ref<string[]>([])

function generateOne(length: number, charSet: string): string {
  if (charSet.length === 0) return ''

  let attempts = 0
  const maxAttempts = 1000

  while (attempts < maxAttempts) {
    attempts++
    let pwd = ''

    // 如果要求以字母开头，先从字母中选一个
    if (startWithLetter.value) {
      const letterChars = charSet.split('').filter(c => /[a-zA-Z]/.test(c)).join('')
      if (letterChars.length === 0) break
      pwd += letterChars[secureRandom(letterChars.length)]
    }

    // 生成剩余字符
    while (pwd.length < length) {
      const ch = charSet[secureRandom(charSet.length)]

      // 禁止重复字符
      if (noRepeat.value && pwd.includes(ch)) continue

      // 禁止连续字符
      if (noConsecutive.value && pwd.length > 0) {
        const lastCode = pwd.charCodeAt(pwd.length - 1)
        const curCode = ch.charCodeAt(0)
        if (Math.abs(lastCode - curCode) === 1) continue
      }

      pwd += ch
    }

    // 确保包含所有选中的字符类型
    const checks: [boolean, string][] = [
      [useUpper.value, UPPER],
      [useLower.value, LOWER],
      [useDigit.value, DIGIT],
      [useSymbol.value, useCustomSymbol.value ? customSymbol.value : '!@#$%^&*()_+-=[]{}|;:,.<>?'],
    ]

    let valid = true
    for (const [enabled, set] of checks) {
      if (!enabled) continue
      const filtered = excludeAmbiguous.value
        ? set.split('').filter(c => !AMBIGUOUS.includes(c)).join('')
        : set
      if (filtered.length === 0) continue
      if (!pwd.split('').some(c => filtered.includes(c))) {
        valid = false
        break
      }
    }

    if (valid) return pwd
  }

  // fallback: 直接生成
  let pwd = ''
  for (let i = 0; i < length; i++) {
    pwd += charSet[secureRandom(charSet.length)]
  }
  return pwd
}

function generate() {
  const charSet = getCharSet()
  if (charSet.length === 0) {
    passwords.value = []
    return
  }
  const results: string[] = []
  for (let i = 0; i < count.value; i++) {
    results.push(generateOne(length.value, charSet))
  }
  passwords.value = results
}

// ===== 密码强度评估 =====
interface StrengthResult {
  score: number // 0-4
  label: string
  color: string
  bgColor: string
  percent: number
  suggestions: string[]
}

function evaluateStrength(pwd: string): StrengthResult {
  let score = 0
  const suggestions: string[] = []

  // 长度评分
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (pwd.length >= 16) score++

  // 字符多样性
  const hasUpper = /[A-Z]/.test(pwd)
  const hasLower = /[a-z]/.test(pwd)
  const hasDigit = /[0-9]/.test(pwd)
  const hasSymbol = /[^a-zA-Z0-9]/.test(pwd)
  const types = [hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length

  if (types >= 3) score++
  if (types >= 4) score++

  // 建议
  if (pwd.length < 12) suggestions.push('建议密码长度至少12位')
  if (!hasUpper) suggestions.push('建议包含大写字母')
  if (!hasLower) suggestions.push('建议包含小写字母')
  if (!hasDigit) suggestions.push('建议包含数字')
  if (!hasSymbol) suggestions.push('建议包含特殊符号')

  // 限制分数范围
  score = Math.min(4, Math.max(0, score))

  const levels = [
    { label: '非常弱', color: 'text-red-600', bgColor: 'bg-red-500', percent: 10 },
    { label: '弱', color: 'text-orange-600', bgColor: 'bg-orange-500', percent: 30 },
    { label: '中等', color: 'text-yellow-600', bgColor: 'bg-yellow-500', percent: 55 },
    { label: '强', color: 'text-blue-600', bgColor: 'bg-blue-500', percent: 80 },
    { label: '非常强', color: 'text-green-600', bgColor: 'bg-green-500', percent: 100 },
  ]

  return { score, ...levels[score], suggestions }
}

const activeStrength = computed<StrengthResult | null>(() => {
  if (passwords.value.length === 0) return null
  return evaluateStrength(passwords.value[0])
})

// ===== 预估破解时间 =====
function estimateCrackTime(pwd: string): string {
  const hasUpper = /[A-Z]/.test(pwd)
  const hasLower = /[a-z]/.test(pwd)
  const hasDigit = /[0-9]/.test(pwd)
  const hasSymbol = /[^a-zA-Z0-9]/.test(pwd)

  let poolSize = 0
  if (hasUpper) poolSize += 26
  if (hasLower) poolSize += 26
  if (hasDigit) poolSize += 10
  if (hasSymbol) poolSize += 32
  if (poolSize === 0) poolSize = 26

  // 组合数 = poolSize^length
  const combinations = Math.pow(poolSize, pwd.length)
  // 假设每秒 10 亿次尝试
  const seconds = combinations / 1e9

  if (seconds < 1) return '不到1秒'
  if (seconds < 60) return `${Math.floor(seconds)}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时`
  if (seconds < 86400 * 365) return `${Math.floor(seconds / 86400)}天`
  if (seconds < 86400 * 365 * 1000) return `${Math.floor(seconds / (86400 * 365))}年`
  if (seconds < 86400 * 365 * 1e6) return `${Math.floor(seconds / (86400 * 365 * 1000))}千年`
  if (seconds < 86400 * 365 * 1e9) return `${Math.floor(seconds / (86400 * 365 * 1e6))}百万年`
  return `${(seconds / (86400 * 365 * 1e9)).toExponential(1)}十亿年`
}

const crackTime = computed(() => {
  if (passwords.value.length === 0) return ''
  return estimateCrackTime(passwords.value[0])
})

// ===== 初始化 =====
generate()

// 字符集变化时自动重新生成
watch(
  [length, useUpper, useLower, useDigit, useSymbol, excludeAmbiguous, startWithLetter, noRepeat, noConsecutive, useCustomSymbol, customSymbol, count],
  () => generate()
)
</script>

<template>
  <ToolCard title="密码生成器" description="使用加密安全的随机数生成器创建高强度密码，支持多种自定义选项">

    <div class="space-y-8">

      <!-- ===== 生成结果 ===== -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-content-secondary flex items-center gap-1.5">
            <ShieldCheck class="h-4 w-4" />
            生成结果
          </h2>
          <button @click="generate" class="btn-secondary btn-sm flex items-center gap-1.5">
            <RefreshCw class="h-3.5 w-3.5" />
            重新生成
          </button>
        </div>

        <div class="space-y-2">
          <div
            v-for="(pwd, idx) in passwords"
            :key="idx"
            class="flex items-center gap-2 rounded-[12px] border border-line bg-surface-secondary px-4 py-3"
          >
            <span class="flex-1 font-mono text-base text-content-primary break-all select-all tracking-wide">
              {{ pwd }}
            </span>
            <CopyButton :text="pwd" label="" size="sm" />
          </div>
        </div>

        <!-- 强度指示条 -->
        <div v-if="activeStrength" class="mt-4 space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span :class="activeStrength.color" class="font-semibold">{{ activeStrength.label }}</span>
            <span v-if="crackTime" class="text-content-tertiary">
              预估破解时间（10亿次/秒）：{{ crackTime }}
            </span>
          </div>
          <div class="h-2 rounded-full bg-surface-tertiary overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="activeStrength.bgColor"
              :style="{ width: activeStrength.percent + '%' }"
            />
          </div>
          <ul v-if="activeStrength.suggestions.length > 0" class="text-xs text-content-tertiary space-y-0.5">
            <li v-for="s in activeStrength.suggestions" :key="s" class="flex items-center gap-1">
              <AlertTriangle class="h-3 w-3 text-amber-500 shrink-0" />
              {{ s }}
            </li>
          </ul>
        </div>
      </section>

      <!-- ===== 基本设置 ===== -->
      <section>
        <h2 class="text-sm font-semibold text-content-secondary mb-3 flex items-center gap-1.5">
          <Settings2 class="h-4 w-4" />
          基本设置
        </h2>

        <div class="space-y-5">
          <!-- 密码长度 -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="label-text">密码长度</label>
              <span class="text-sm font-mono text-content-primary font-semibold">{{ length }}</span>
            </div>
            <input
              v-model.number="length"
              type="range"
              min="4"
              max="128"
              class="w-full h-2 rounded-full appearance-none cursor-pointer bg-surface-tertiary accent-[var(--accent)]"
            />
            <div class="flex justify-between text-xs text-content-tertiary mt-1">
              <span>4</span>
              <span>128</span>
            </div>
          </div>

          <!-- 生成数量 -->
          <div>
            <label class="label-text">生成数量</label>
            <div class="flex items-center gap-3 mt-1.5">
              <input
                v-model.number="count"
                type="range"
                min="1"
                max="20"
                class="flex-1 h-2 rounded-full appearance-none cursor-pointer bg-surface-tertiary accent-[var(--accent)]"
              />
              <span class="text-sm font-mono text-content-primary font-semibold w-8 text-right">{{ count }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== 字符类型 ===== -->
      <section>
        <h2 class="text-sm font-semibold text-content-secondary mb-3">字符类型</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="flex items-center gap-3 rounded-[10px] border border-line bg-surface-secondary px-4 py-3 cursor-pointer hover:border-[var(--accent)] transition-colors">
            <input type="checkbox" v-model="useUpper" class="accent-[var(--accent)] w-4 h-4" />
            <div>
              <div class="text-sm text-content-primary font-medium">大写字母</div>
              <div class="text-xs text-content-tertiary font-mono">A-Z</div>
            </div>
          </label>
          <label class="flex items-center gap-3 rounded-[10px] border border-line bg-surface-secondary px-4 py-3 cursor-pointer hover:border-[var(--accent)] transition-colors">
            <input type="checkbox" v-model="useLower" class="accent-[var(--accent)] w-4 h-4" />
            <div>
              <div class="text-sm text-content-primary font-medium">小写字母</div>
              <div class="text-xs text-content-tertiary font-mono">a-z</div>
            </div>
          </label>
          <label class="flex items-center gap-3 rounded-[10px] border border-line bg-surface-secondary px-4 py-3 cursor-pointer hover:border-[var(--accent)] transition-colors">
            <input type="checkbox" v-model="useDigit" class="accent-[var(--accent)] w-4 h-4" />
            <div>
              <div class="text-sm text-content-primary font-medium">数字</div>
              <div class="text-xs text-content-tertiary font-mono">0-9</div>
            </div>
          </label>
          <label class="flex items-center gap-3 rounded-[10px] border border-line bg-surface-secondary px-4 py-3 cursor-pointer hover:border-[var(--accent)] transition-colors">
            <input type="checkbox" v-model="useSymbol" class="accent-[var(--accent)] w-4 h-4" />
            <div>
              <div class="text-sm text-content-primary font-medium">特殊符号</div>
              <div class="text-xs text-content-tertiary font-mono">!@#$%^&*()_+-=...</div>
            </div>
          </label>
        </div>

        <!-- 自定义符号 -->
        <div v-if="useSymbol" class="mt-3 space-y-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="useCustomSymbol" class="accent-[var(--accent)] w-4 h-4" />
            <span class="text-sm text-content-secondary">使用自定义符号</span>
          </label>
          <input
            v-if="useCustomSymbol"
            v-model="customSymbol"
            class="input-field font-mono text-sm"
            placeholder="输入自定义特殊符号"
          />
        </div>
      </section>

      <!-- ===== 高级选项 ===== -->
      <section>
        <h2 class="text-sm font-semibold text-content-secondary mb-3">高级选项</h2>
        <div class="space-y-2.5">
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="excludeAmbiguous" class="accent-[var(--accent)] w-4 h-4" />
            <div>
              <span class="text-sm text-content-primary">排除易混淆字符</span>
              <span class="text-xs text-content-tertiary ml-1.5">(i, l, 1, L, o, 0, O)</span>
            </div>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="startWithLetter" class="accent-[var(--accent)] w-4 h-4" />
            <div>
              <span class="text-sm text-content-primary">以字母开头</span>
            </div>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="noRepeat" class="accent-[var(--accent)] w-4 h-4" />
            <div>
              <span class="text-sm text-content-primary">禁止重复字符</span>
            </div>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="noConsecutive" class="accent-[var(--accent)] w-4 h-4" />
            <div>
              <span class="text-sm text-content-primary">禁止连续字符</span>
              <span class="text-xs text-content-tertiary ml-1.5">(如 ab, 12, XY)</span>
            </div>
          </label>
        </div>
      </section>

      <!-- ===== 使用说明 ===== -->
      <div class="rounded-[12px] bg-surface-secondary border border-line p-4">
        <h3 class="text-xs font-semibold text-content-secondary mb-2">安全说明</h3>
        <ul class="text-xs text-content-tertiary space-y-1">
          <li>• 使用 <span class="font-mono">crypto.getRandomValues()</span> 生成密码，具备密码学安全性</li>
          <li>• 所有操作在浏览器本地完成，不上传任何数据</li>
          <li>• 建议密码长度至少12位，包含大小写字母、数字和特殊符号</li>
          <li>• 建议为不同网站使用不同密码，并定期更换</li>
        </ul>
      </div>

    </div>
  </ToolCard>
</template>
