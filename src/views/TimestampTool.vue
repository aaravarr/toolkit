<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import relativeTime from 'dayjs/plugin/relativeTime'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/zh-cn'
import ToolCard from '../components/ToolCard.vue'
import CopyButton from '../components/CopyButton.vue'
import {
  Clock,
  Loader2,
  CircleCheckBig,
  AlertCircle,
} from 'lucide-vue-next'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)
dayjs.extend(customParseFormat)
dayjs.locale('zh-cn')

// ===== 当前时间 =====
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval>

onMounted(() => {
  timer = setInterval(() => { now.value = Date.now() }, 1000)
})
onUnmounted(() => clearInterval(timer))

const nowFormatted = computed(() => dayjs(now.value).format('YYYY-MM-DD HH:mm:ss'))
const nowMs = computed(() => now.value)
const nowS = computed(() => Math.floor(now.value / 1000))

// ===== 智能粘贴/输入解析 =====
const rawInput = ref('')
const parsedDate = ref<dayjs.Dayjs | null>(null)
const parseError = ref('')
const parseSource = ref('') // 描述识别来源

function detectAndParse(input: string) {
  const trimmed = input.trim()
  if (!trimmed) {
    parsedDate.value = null
    parseError.value = ''
    parseSource.value = ''
    return
  }

  // 1. 纯数字 → 时间戳
  if (/^\d{1,}$/.test(trimmed)) {
    const num = Number(trimmed)
    // 13位 → 毫秒，10位 → 秒，其他位数也尝试毫秒
    if (trimmed.length >= 13) {
      const d = dayjs(num)
      if (d.isValid()) {
        parsedDate.value = d
        parseError.value = ''
        parseSource.value = '识别为毫秒时间戳'
        return
      }
    }
    if (trimmed.length >= 10) {
      const d = dayjs.unix(num)
      if (d.isValid() && d.year() > 1970 && d.year() < 2100) {
        parsedDate.value = d
        parseError.value = ''
        parseSource.value = '识别为秒级时间戳'
        return
      }
      // 也尝试毫秒
      const d2 = dayjs(num)
      if (d2.isValid()) {
        parsedDate.value = d2
        parseError.value = ''
        parseSource.value = '识别为毫秒时间戳'
        return
      }
    }
    // 短数字尝试秒
    const d = dayjs.unix(num)
    if (d.isValid() && d.year() > 1970 && d.year() < 2100) {
      parsedDate.value = d
      parseError.value = ''
      parseSource.value = '识别为秒级时间戳'
      return
    }
  }

  // 2. ISO 8601 格式 (含 T 和时区)
  const iso = dayjs(trimmed)
  if (iso.isValid() && (trimmed.includes('T') || trimmed.includes('Z') || trimmed.includes('+'))) {
    parsedDate.value = iso
    parseError.value = ''
    parseSource.value = '识别为 ISO 8601 格式'
    return
  }

  // 3. 常见日期格式，用 customParseFormat 逐个尝试
  const formats = [
    'YYYY-MM-DD HH:mm:ss',
    'YYYY-MM-DD HH:mm',
    'YYYY-MM-DD',
    'YYYY/MM/DD HH:mm:ss',
    'YYYY/MM/DD HH:mm',
    'YYYY/MM/DD',
    'YYYY年MM月DD日 HH:mm:ss',
    'YYYY年MM月DD日 HH:mm',
    'YYYY年MM月DD日',
    'MM-DD-YYYY',
    'MM/DD/YYYY',
    'DD-MM-YYYY',
    'DD/MM/YYYY',
    'YYYYMMDDHHmmss',
    'YYYYMMDD',
  ]
  for (const fmt of formats) {
    const d = dayjs(trimmed, fmt, true)
    if (d.isValid()) {
      parsedDate.value = d
      parseError.value = ''
      parseSource.value = `识别为 ${fmt} 格式`
      return
    }
  }

  // 4. 兜底：dayjs 自动解析
  const fallback = dayjs(trimmed)
  if (fallback.isValid()) {
    parsedDate.value = fallback
    parseError.value = ''
    parseSource.value = '自动解析'
    return
  }

  // 无法识别
  parsedDate.value = null
  parseError.value = '无法识别该时间格式'
  parseSource.value = ''
}

// 监听输入变化
function onInputChange() {
  detectAndParse(rawInput.value)
}

// 粘贴事件：自动解析
function onPaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text')
  if (text) {
    // 延迟一帧让 v-model 先更新
    setTimeout(() => detectAndParse(rawInput.value), 0)
  }
}

// 设为当前时间
function setCurrentTime() {
  rawInput.value = String(now.value)
  detectAndParse(rawInput.value)
}

// ===== 解析结果展示 =====
const resultMs = computed(() => parsedDate.value ? parsedDate.value.valueOf() : null)
const resultS = computed(() => parsedDate.value ? Math.floor(parsedDate.value.valueOf() / 1000) : null)
const resultIso = computed(() => parsedDate.value ? parsedDate.value.format() : '')
const resultFormatted = computed(() => parsedDate.value ? parsedDate.value.format('YYYY-MM-DD HH:mm:ss') : '')
const resultRelative = computed(() => {
  if (!parsedDate.value) return ''
  return parsedDate.value.fromNow()
})

// ===== 时间计算 =====
const calcInput = ref('')
const calcUnit = ref('d')
const calcResult = ref('')

const calcUnits = [
  { value: 'y', label: '年' },
  { value: 'M', label: '月' },
  { value: 'w', label: '周' },
  { value: 'd', label: '天' },
  { value: 'h', label: '小时' },
  { value: 'm', label: '分钟' },
  { value: 's', label: '秒' },
]

function calculateTime() {
  const base = parsedDate.value || dayjs()
  const num = parseFloat(calcInput.value)
  if (isNaN(num)) {
    calcResult.value = '请输入有效的数字'
    return
  }
  const result = base.add(num, calcUnit.value as any)
  calcResult.value = result.format('YYYY-MM-DD HH:mm:ss')
}

// ===== 时区转换 =====
const selectedTimezone = ref(dayjs.tz.guess())
const timezones = [
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Singapore',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Pacific/Auckland',
  'Australia/Sydney',
  'UTC',
]

const timezoneResult = computed(() => {
  if (!parsedDate.value) return ''
  return parsedDate.value.tz(selectedTimezone.value).format('YYYY-MM-DD HH:mm:ss z')
})

// ===== 自定义格式 =====
const customFormat = ref('YYYY-MM-DD HH:mm:ss')
const customFormatResult = computed(() => {
  if (!parsedDate.value) return ''
  return parsedDate.value.format(customFormat.value)
})

// ===== 快捷格式模板 =====
const formatPresets = [
  'YYYY-MM-DD HH:mm:ss',
  'YYYY/MM/DD HH:mm:ss',
  'YYYY-MM-DD',
  'YYYY年MM月DD日 HH:mm:ss',
  'YYYYMMDDHHmmss',
  'X',
  'x',
  'YYYY-MM-DDTHH:mm:ssZ',
]

function applyFormat(fmt: string) {
  customFormat.value = fmt
}
</script>

<template>
  <ToolCard title="时间戳工具" description="粘贴或输入时间戳、日期字符串，自动识别并转换">

    <div class="space-y-8">

      <!-- ===== 当前时间 ===== -->
      <section>
        <h2 class="text-sm font-semibold text-content-secondary mb-3 flex items-center gap-1.5">
          <Clock class="h-4 w-4" />
          当前时间
        </h2>
        <div
          class="rounded-[12px] border border-line p-4 bg-surface-secondary"
        >
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="space-y-1">
              <p class="text-2xl font-mono font-semibold text-content-primary tracking-tight">{{ nowFormatted }}</p>
              <div class="flex flex-wrap gap-4 text-xs text-content-tertiary">
                <span>毫秒: <span class="font-mono text-content-secondary">{{ nowMs }}</span></span>
                <span>秒: <span class="font-mono text-content-secondary">{{ nowS }}</span></span>
              </div>
            </div>
            <div class="flex gap-2">
              <CopyButton :text="String(nowMs)" label="复制毫秒" size="sm" />
              <CopyButton :text="String(nowS)" label="复制秒" size="sm" />
            </div>
          </div>
        </div>
      </section>

      <!-- ===== 智能解析区 ===== -->
      <section>
        <h2 class="text-sm font-semibold text-content-secondary mb-3 flex items-center gap-1.5">
          <Loader2 class="h-4 w-4 animate-spin" />
          智能解析
        </h2>

        <div class="space-y-3">
          <div class="flex gap-2">
            <input
              v-model="rawInput"
              @input="onInputChange"
              @paste="onPaste"
              class="input-field flex-1 font-mono"
              placeholder="粘贴时间戳或日期字符串，例如：1717843200000、2024-06-08 12:00:00"
            />
            <button @click="setCurrentTime" class="btn-secondary whitespace-nowrap">
              设为当前
            </button>
          </div>

          <!-- 解析状态 -->
          <div v-if="parseSource" class="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            <CircleCheckBig class="h-3.5 w-3.5" />
            {{ parseSource }}
          </div>
          <div v-if="parseError" class="flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle class="h-3.5 w-3.5" />
            {{ parseError }}
          </div>
        </div>

        <!-- 解析结果 -->
        <div
          v-if="parsedDate"
          class="mt-4 rounded-[12px] border border-line overflow-hidden"
        >
          <table class="w-full text-sm">
            <tbody>
              <tr class="border-b border-line">
                <td class="px-4 py-2.5 text-content-tertiary w-32 whitespace-nowrap">格式化</td>
                <td class="px-4 py-2.5 font-mono text-content-primary">{{ resultFormatted }}</td>
                <td class="px-4 py-2.5 w-16 text-right">
                  <CopyButton :text="resultFormatted" label="" size="sm" />
                </td>
              </tr>
              <tr class="border-b border-line">
                <td class="px-4 py-2.5 text-content-tertiary">毫秒时间戳</td>
                <td class="px-4 py-2.5 font-mono text-content-primary">{{ resultMs }}</td>
                <td class="px-4 py-2.5 text-right">
                  <CopyButton :text="String(resultMs)" label="" size="sm" />
                </td>
              </tr>
              <tr class="border-b border-line">
                <td class="px-4 py-2.5 text-content-tertiary">秒时间戳</td>
                <td class="px-4 py-2.5 font-mono text-content-primary">{{ resultS }}</td>
                <td class="px-4 py-2.5 text-right">
                  <CopyButton :text="String(resultS)" label="" size="sm" />
                </td>
              </tr>
              <tr class="border-b border-line">
                <td class="px-4 py-2.5 text-content-tertiary">ISO 8601</td>
                <td class="px-4 py-2.5 font-mono text-content-primary break-all">{{ resultIso }}</td>
                <td class="px-4 py-2.5 text-right">
                  <CopyButton :text="resultIso" label="" size="sm" />
                </td>
              </tr>
              <tr>
                <td class="px-4 py-2.5 text-content-tertiary">相对时间</td>
                <td class="px-4 py-2.5 text-content-primary" colspan="2">{{ resultRelative }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ===== 时区转换 ===== -->
      <section v-if="parsedDate">
        <h2 class="text-sm font-semibold text-content-secondary mb-3">时区转换</h2>
        <div class="flex flex-col sm:flex-row gap-2">
          <select v-model="selectedTimezone" class="select-field sm:w-64">
            <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz }}</option>
          </select>
        </div>
        <p class="mt-2 text-sm font-mono text-content-primary">{{ timezoneResult }}</p>
      </section>

      <!-- ===== 自定义格式 ===== -->
      <section v-if="parsedDate">
        <h2 class="text-sm font-semibold text-content-secondary mb-3">自定义格式</h2>
        <div class="flex gap-2">
          <input v-model="customFormat" class="input-field flex-1 font-mono" placeholder="YYYY-MM-DD HH:mm:ss" />
        </div>
        <!-- 快捷格式 -->
        <div class="flex flex-wrap gap-1.5 mt-2">
          <button
            v-for="fmt in formatPresets"
            :key="fmt"
            @click="applyFormat(fmt)"
            class="px-2 py-1 text-xs font-mono rounded-lg border border-line text-content-secondary hover:bg-surface-tertiary transition-colors cursor-pointer"
          >
            {{ fmt }}
          </button>
        </div>
        <p class="mt-2 text-sm font-mono text-content-primary">{{ customFormatResult }}</p>
      </section>

      <!-- ===== 时间计算 ===== -->
      <section>
        <h2 class="text-sm font-semibold text-content-secondary mb-3">时间计算</h2>
        <p class="text-xs text-content-tertiary mb-2">
          {{ parsedDate ? '基于解析结果计算' : '基于当前时间计算' }}
        </p>
        <div class="flex flex-col sm:flex-row gap-2">
          <input
            v-model="calcInput"
            class="input-field sm:w-32"
            type="number"
            placeholder="数字"
          />
          <select v-model="calcUnit" class="select-field sm:w-28">
            <option v-for="u in calcUnits" :key="u.value" :value="u.value">{{ u.label }}</option>
          </select>
          <button @click="calculateTime" class="btn-primary whitespace-nowrap">计算</button>
        </div>
        <p v-if="calcResult" class="mt-2 text-sm font-mono text-content-primary">{{ calcResult }}</p>
      </section>

    </div>
  </ToolCard>
</template>
