<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'
import ToolCard from '../components/ToolCard.vue'
import CopyButton from '../components/CopyButton.vue'
import CustomSelect from '../components/CustomSelect.vue'
import {
  RotateCcw,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-vue-next'

// ===== Cron 字段类型 =====
type FieldMode = 'every' | 'specific' | 'range' | 'step' | 'list'

interface CronField {
  mode: FieldMode
  specific: number[]
  rangeStart: number
  rangeEnd: number
  stepFrom: number
  stepValue: number
  listValues: number[]
}

// ===== 字段配置 =====
const fieldConfigs = [
  { key: 'minute', label: '分钟', min: 0, max: 59, placeholder: '0-59' },
  { key: 'hour', label: '小时', min: 0, max: 23, placeholder: '0-23' },
  { key: 'day', label: '日', min: 1, max: 31, placeholder: '1-31' },
  { key: 'month', label: '月', min: 1, max: 12, placeholder: '1-12' },
  { key: 'weekday', label: '星期', min: 0, max: 7, placeholder: '0-7 (0和7=周日)' },
]

const weekdayNames = ['日', '一', '二', '三', '四', '五', '六', '日']
const monthNames = ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

// ===== Cron 字段状态 =====
const fields = ref<CronField[]>([
  { mode: 'every', specific: [], rangeStart: 0, rangeEnd: 59, stepFrom: 0, stepValue: 1, listValues: [] },
  { mode: 'every', specific: [], rangeStart: 0, rangeEnd: 23, stepFrom: 0, stepValue: 1, listValues: [] },
  { mode: 'every', specific: [], rangeStart: 1, rangeEnd: 31, stepFrom: 1, stepValue: 1, listValues: [] },
  { mode: 'every', specific: [], rangeStart: 1, rangeEnd: 12, stepFrom: 1, stepValue: 1, listValues: [] },
  { mode: 'every', specific: [], rangeStart: 0, rangeEnd: 7, stepFrom: 0, stepValue: 1, listValues: [] },
])

// ===== 模式选项 =====
const fieldModes: { key: FieldMode; label: string; desc: string }[] = [
  { key: 'every', label: '每*', desc: '每一单位都执行' },
  { key: 'specific', label: '指定', desc: '选择特定值' },
  { key: 'range', label: '范围', desc: '连续值范围' },
  { key: 'step', label: '间隔', desc: '从某值开始每隔N单位' },
  { key: 'list', label: '列表', desc: '自定义多个值' },
]

// ===== 直接输入模式 =====
const directInput = ref(false)
const directExpression = ref('* * * * *')
const parseError = ref('')

// ===== 常用预设 =====
const presets: { label: string; cron: string; desc: string }[] = [
  { label: '每分钟', cron: '* * * * *', desc: '每分钟执行一次' },
  { label: '每5分钟', cron: '*/5 * * * *', desc: '每隔5分钟执行' },
  { label: '每15分钟', cron: '*/15 * * * *', desc: '每隔15分钟执行' },
  { label: '每30分钟', cron: '*/30 * * * *', desc: '每隔30分钟执行' },
  { label: '每小时', cron: '0 * * * *', desc: '每小时整点执行' },
  { label: '每天零点', cron: '0 0 * * *', desc: '每天凌晨0点执行' },
  { label: '每天上午9点', cron: '0 9 * * *', desc: '每天上午9点执行' },
  { label: '每天下午6点', cron: '0 18 * * *', desc: '每天下午6点执行' },
  { label: '工作日9点', cron: '0 9 * * 1-5', desc: '周一到周五上午9点' },
  { label: '每周一9点', cron: '0 9 * * 1', desc: '每周一上午9点' },
  { label: '每月1号零点', cron: '0 0 1 * *', desc: '每月1日凌晨0点' },
  { label: '每月1号和15号', cron: '0 0 1,15 * *', desc: '每月1号和15号零点' },
  { label: '每季度首月1号', cron: '0 0 1 1,4,7,10 *', desc: '每季度第一天零点' },
  { label: '每年1月1号', cron: '0 0 1 1 *', desc: '每年元旦零点' },
  { label: '每小时第30分钟', cron: '30 * * * *', desc: '每小时的第30分钟' },
]

// ===== 展开/折叠字段面板 =====
const expandedFields = ref<boolean[]>([true, false, false, false, false])

function toggleField(index: number) {
  expandedFields.value[index] = !expandedFields.value[index]
}

// ===== 生成 Cron 表达式 =====
function fieldToCron(field: CronField, config: typeof fieldConfigs[0]): string {
  switch (field.mode) {
    case 'every':
      return '*'
    case 'specific': {
      if (field.specific.length === 0) return '*'
      return field.specific.sort((a, b) => a - b).join(',')
    }
    case 'range':
      if (field.rangeStart === config.min && field.rangeEnd === config.max) return '*'
      return `${field.rangeStart}-${field.rangeEnd}`
    case 'step':
      if (field.stepValue <= 1) return '*'
      if (field.stepFrom === config.min) return `*/${field.stepValue}`
      return `${field.stepFrom}/${field.stepValue}`
    case 'list': {
      if (field.listValues.length === 0) return '*'
      return field.listValues.sort((a, b) => a - b).join(',')
    }
    default:
      return '*'
  }
}

const cronExpression = computed(() => {
  if (directInput.value) return directExpression.value
  return fields.value.map((f, i) => fieldToCron(f, fieldConfigs[i])).join(' ')
})

// ===== 解析 Cron 表达式到 UI =====
function parseToUI(expr: string) {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) {
    parseError.value = 'Cron 表达式必须包含 5 个字段（分 时 日 月 周）'
    return
  }
  parseError.value = ''

  parts.forEach((part, i) => {
    const field = fields.value[i]
    const config = fieldConfigs[i]

    if (part === '*') {
      field.mode = 'every'
    } else if (part.includes('/')) {
      const [from, step] = part.split('/')
      field.mode = 'step'
      field.stepFrom = from === '*' ? config.min : parseInt(from)
      field.stepValue = parseInt(step)
    } else if (part.includes('-')) {
      const [start, end] = part.split('-')
      field.mode = 'range'
      field.rangeStart = parseInt(start)
      field.rangeEnd = parseInt(end)
    } else if (part.includes(',')) {
      const values = part.split(',').map(Number)
      if (values.length <= 4) {
        field.mode = 'specific'
        field.specific = values
      } else {
        field.mode = 'list'
        field.listValues = values
      }
    } else {
      const val = parseInt(part)
      field.mode = 'specific'
      field.specific = [val]
    }
  })
}

// ===== 从直接输入同步到 UI =====
function syncFromDirect() {
  parseToUI(directExpression.value)
}

// ===== 从 UI 同步到直接输入 =====
function syncToDirect() {
  directExpression.value = cronExpression.value
}

// ===== 人类可读描述 =====
const humanReadable = computed(() => {
  const expr = cronExpression.value
  const parts = expr.split(/\s+/)
  if (parts.length !== 5) return '无效的 Cron 表达式'

  const [min, hour, day, month, weekday] = parts

  // 构建描述
  let desc = ''

  // 星期
  if (weekday !== '*') {
    if (weekday.includes('-')) {
      const [s, e] = weekday.split('-')
      desc += `在星期${weekdayNames[parseInt(s)]}到星期${weekdayNames[parseInt(e)]}`
    } else if (weekday.includes(',')) {
      const days = weekday.split(',').map((d) => `星期${weekdayNames[parseInt(d)]}`)
      desc += `在${days.join('、')}`
    } else {
      desc += `在星期${weekdayNames[parseInt(weekday)]}`
    }
  }

  // 月份
  if (month !== '*') {
    if (month.includes('-')) {
      const [s, e] = month.split('-')
      desc += `的${monthNames[parseInt(s)]}到${monthNames[parseInt(e)]}`
    } else if (month.includes(',')) {
      const months = month.split(',').map((m) => monthNames[parseInt(m)])
      desc += `的${months.join('、')}`
    } else if (month.includes('/')) {
      const [from, step] = month.split('/')
      desc += `从${monthNames[parseInt(from)]}开始每隔${step}个月`
    } else {
      desc += `的${monthNames[parseInt(month)]}`
    }
  }

  // 日
  if (day !== '*') {
    if (day.includes('-')) {
      const [s, e] = day.split('-')
      desc += `的${s}号到${e}号`
    } else if (day.includes(',')) {
      const days = day.split(',').map((d) => `${d}号`)
      desc += `的${days.join('、')}`
    } else if (day.includes('/')) {
      const [from, step] = day.split('/')
      desc += `从${from}号开始每隔${step}天`
    } else {
      desc += `的${day}号`
    }
  }

  // 小时
  if (hour !== '*') {
    if (hour.includes('-')) {
      const [s, e] = hour.split('-')
      desc += ` ${s}时到${e}时`
    } else if (hour.includes(',')) {
      const hours = hour.split(',').map((h) => `${h}时`)
      desc += ` ${hours.join('、')}`
    } else if (hour.includes('/')) {
      const [from, step] = hour.split('/')
      desc += ` 从${from}时开始每隔${step}小时`
    } else {
      desc += ` ${hour}时`
    }
  }

  // 分钟
  if (min !== '*') {
    if (min.includes('-')) {
      const [s, e] = min.split('-')
      desc += ` ${s}分到${e}分`
    } else if (min.includes(',')) {
      const mins = min.split(',').map((m) => `${m}分`)
      desc += ` ${mins.join('、')}`
    } else if (min.includes('/')) {
      const [from, step] = min.split('/')
      if (from === '*' || from === '0') {
        desc += ` 每隔${step}分钟`
      } else {
        desc += ` 从${from}分开始每隔${step}分钟`
      }
    } else {
      desc += ` ${min}分`
    }
  }

  // 全星号特殊处理
  if (min === '*' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
    return '每分钟执行一次'
  }

  // 补充"执行"
  if (min.includes('/') && !desc.includes('每隔')) {
    // 已经在分钟处理中包含了
  }

  // 简化描述
  if (!desc) desc = '每分钟'

  return desc + '执行'
})

// ===== 计算未来 N 次执行时间 =====
const nextExecCount = ref(10)
const showNextExec = ref(true)

const nextExecutions = computed(() => {
  const expr = cronExpression.value
  const parts = expr.split(/\s+/)
  if (parts.length !== 5) return []

  const [minExpr, hourExpr, dayExpr, monthExpr, weekdayExpr] = parts
  const results: Date[] = []
  const now = new Date()
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0)

  const maxIterations = 525960 // 1年分钟数
  let iterations = 0

  while (results.length < nextExecCount.value && iterations < maxIterations) {
    iterations++
    const minute = cursor.getMinutes()
    const hour = cursor.getHours()
    const day = cursor.getDate()
    const month = cursor.getMonth() + 1
    const weekday = cursor.getDay() // 0=Sun

    if (
      matchField(minute, minExpr, 0, 59) &&
      matchField(hour, hourExpr, 0, 23) &&
      matchField(day, dayExpr, 1, 31) &&
      matchField(month, monthExpr, 1, 12) &&
      matchWeekday(weekday, weekdayExpr)
    ) {
      results.push(new Date(cursor))
    }

    cursor.setMinutes(cursor.getMinutes() + 1)
  }

  return results
})

function matchField(value: number, expr: string, min: number, max: number): boolean {
  if (expr === '*') return true

  // 处理逗号分隔的多个表达式
  if (expr.includes(',')) {
    return expr.split(',').some((part) => matchField(value, part.trim(), min, max))
  }

  // 处理步进
  if (expr.includes('/')) {
    const [fromStr, stepStr] = expr.split('/')
    const step = parseInt(stepStr)
    if (step <= 0) return false
    const from = fromStr === '*' ? min : parseInt(fromStr)
    return value >= from && (value - from) % step === 0
  }

  // 处理范围
  if (expr.includes('-')) {
    const [s, e] = expr.split('-').map(Number)
    return value >= s && value <= e
  }

  // 精确值
  return value === parseInt(expr)
}

function matchWeekday(value: number, expr: string): boolean {
  if (expr === '*') return true

  // 处理 7=0 (周日)
  const normalize = (v: number) => (v === 7 ? 0 : v)

  if (expr.includes(',')) {
    return expr.split(',').some((part) => matchWeekday(value, part.trim()))
  }

  if (expr.includes('/')) {
    const [fromStr, stepStr] = expr.split('/')
    const step = parseInt(stepStr)
    const from = fromStr === '*' ? 0 : parseInt(fromStr)
    return value >= from && (value - from) % step === 0
  }

  if (expr.includes('-')) {
    const [s, e] = expr.split('-').map(Number)
    return value >= normalize(s) && value <= normalize(e)
  }

  return value === normalize(parseInt(expr))
}

// ===== 格式化时间 =====
function formatTime(date: Date): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss ddd')
}

// ===== 应用预设 =====
function applyPreset(cron: string) {
  if (directInput.value) {
    directExpression.value = cron
    syncFromDirect()
  } else {
    parseToUI(cron)
    syncToDirect()
  }
}

// ===== 重置 =====
function resetFields() {
  fields.value = [
    { mode: 'every', specific: [], rangeStart: 0, rangeEnd: 59, stepFrom: 0, stepValue: 1, listValues: [] },
    { mode: 'every', specific: [], rangeStart: 0, rangeEnd: 23, stepFrom: 0, stepValue: 1, listValues: [] },
    { mode: 'every', specific: [], rangeStart: 1, rangeEnd: 31, stepFrom: 1, stepValue: 1, listValues: [] },
    { mode: 'every', specific: [], rangeStart: 1, rangeEnd: 12, stepFrom: 1, stepValue: 1, listValues: [] },
    { mode: 'every', specific: [], rangeStart: 0, rangeEnd: 7, stepFrom: 0, stepValue: 1, listValues: [] },
  ]
  directExpression.value = '* * * * *'
  parseError.value = ''
}

// ===== 切换特定值选择 =====
function toggleSpecific(fieldIndex: number, value: number) {
  const field = fields.value[fieldIndex]
  const idx = field.specific.indexOf(value)
  if (idx >= 0) {
    field.specific.splice(idx, 1)
  } else {
    field.specific.push(value)
  }
}

// ===== 生成数字范围 =====
function range(min: number, max: number): number[] {
  const arr: number[] = []
  for (let i = min; i <= max; i++) arr.push(i)
  return arr
}

// ===== 同步直接输入 =====
watch(directInput, (val) => {
  if (val) {
    syncToDirect()
  } else {
    syncFromDirect()
  }
})

// ===== 监听 UI 变化同步到直接输入 =====
watch(fields, () => {
  if (!directInput.value) {
    syncToDirect()
  }
}, { deep: true })
</script>

<template>
  <ToolCard title="Cron 表达式生成器" description="可视化生成和解析 Cron 定时任务表达式，支持常用预设、人类可读描述和未来执行时间预览">
    <div class="space-y-6">
      <!-- Cron 表达式显示/输入 -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="label-text">Cron 表达式</label>
          <label class="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="directInput" class="rounded border-line" />
            <span class="text-xs text-content-secondary">直接输入</span>
          </label>
        </div>

        <!-- 直接输入模式 -->
        <div v-if="directInput" class="space-y-2">
          <div class="flex gap-3">
            <input
              v-model="directExpression"
              class="input-field font-mono flex-1 text-base tracking-wider"
              placeholder="* * * * *"
              @blur="syncFromDirect"
            />
            <CopyButton :text="directExpression" label="复制" />
          </div>
          <div v-if="parseError" class="text-xs text-red-500">{{ parseError }}</div>
        </div>

        <!-- 可视化模式 -->
        <div v-else class="flex gap-3 items-center">
          <div class="flex-1 bg-surface-secondary rounded-xl border border-line p-3 font-mono text-lg tracking-widest text-center text-content-primary">
            {{ cronExpression }}
          </div>
          <CopyButton :text="cronExpression" label="复制" />
        </div>

        <!-- 人类可读描述 -->
        <div class="mt-3 flex items-start gap-2 p-3 rounded-lg bg-accent-soft border border-accent/20">
          <Clock class="h-4 w-4 text-accent mt-0.5 shrink-0" />
          <div>
            <p class="text-sm font-medium text-accent">{{ humanReadable }}</p>
          </div>
        </div>
      </div>

      <!-- 常用预设 -->
      <div>
        <label class="label-text flex items-center gap-2">
          <Zap class="h-3.5 w-3.5" />
          常用预设
        </label>
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="preset in presets"
            :key="preset.cron"
            @click="applyPreset(preset.cron)"
            class="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-secondary text-content-secondary hover:bg-surface-primary border border-line hover:border-accent/30 transition-all cursor-pointer"
            :title="preset.desc"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <!-- 字段编辑器（可视化模式） -->
      <div v-if="!directInput" class="space-y-3">
        <label class="label-text">字段设置</label>
        <div
          v-for="(config, idx) in fieldConfigs"
          :key="config.key"
          class="border border-line rounded-xl overflow-hidden"
        >
          <!-- 字段头部 -->
          <button
            @click="toggleField(idx)"
            class="w-full flex items-center justify-between px-4 py-3 bg-surface-secondary hover:bg-surface-primary transition-colors cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <span class="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center text-sm font-bold">
                {{ cronExpression.split(' ')[idx] || '*' }}
              </span>
              <div class="text-left">
                <div class="text-sm font-medium text-content-primary">{{ config.label }}</div>
                <div class="text-xs text-content-tertiary">{{ config.placeholder }}</div>
              </div>
            </div>
            <component :is="expandedFields[idx] ? ChevronUp : ChevronDown" class="h-4 w-4 text-content-tertiary" />
          </button>

          <!-- 字段内容 -->
          <div v-if="expandedFields[idx]" class="p-4 space-y-3 border-t border-line">
            <!-- 模式选择 -->
            <div class="flex flex-wrap gap-2">
              <button
                v-for="mode in fieldModes"
                :key="mode.key"
                @click="fields[idx].mode = mode.key"
                :class="[
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  fields[idx].mode === mode.key
                    ? 'bg-accent-soft text-accent ring-1 ring-accent/30'
                    : 'bg-surface-secondary text-content-secondary hover:bg-surface-primary border border-line',
                ]"
                :title="mode.desc"
              >
                {{ mode.label }}
              </button>
            </div>

            <!-- 每* -->
            <div v-if="fields[idx].mode === 'every'" class="text-xs text-content-tertiary">
              每个{{ config.label }}都执行
            </div>

            <!-- 指定值 -->
            <div v-if="fields[idx].mode === 'specific'" class="space-y-2">
              <div class="text-xs text-content-tertiary">点击选择特定的{{ config.label }}值：</div>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="val in range(config.min, config.max)"
                  :key="val"
                  @click="toggleSpecific(idx, val)"
                  :class="[
                    'w-9 h-9 rounded-lg text-xs font-medium transition-all cursor-pointer',
                    fields[idx].specific.includes(val)
                      ? 'bg-accent text-white'
                      : 'bg-surface-secondary text-content-secondary hover:bg-surface-primary border border-line',
                  ]"
                >
                  {{ config.key === 'weekday' ? weekdayNames[val] : val }}
                </button>
              </div>
            </div>

            <!-- 范围 -->
            <div v-if="fields[idx].mode === 'range'" class="flex items-center gap-3">
              <div class="flex-1">
                <label class="text-xs text-content-tertiary">起始</label>
                <input
                  v-model.number="fields[idx].rangeStart"
                  type="number"
                  :min="config.min"
                  :max="config.max"
                  class="input-field mt-1"
                />
              </div>
              <span class="text-content-tertiary pt-4">-</span>
              <div class="flex-1">
                <label class="text-xs text-content-tertiary">结束</label>
                <input
                  v-model.number="fields[idx].rangeEnd"
                  type="number"
                  :min="config.min"
                  :max="config.max"
                  class="input-field mt-1"
                />
              </div>
            </div>

            <!-- 间隔 -->
            <div v-if="fields[idx].mode === 'step'" class="flex items-center gap-3">
              <div class="flex-1">
                <label class="text-xs text-content-tertiary">从</label>
                <input
                  v-model.number="fields[idx].stepFrom"
                  type="number"
                  :min="config.min"
                  :max="config.max"
                  class="input-field mt-1"
                />
              </div>
              <span class="text-content-tertiary pt-4">开始，每隔</span>
              <div class="w-24">
                <label class="text-xs text-content-tertiary">间隔</label>
                <input
                  v-model.number="fields[idx].stepValue"
                  type="number"
                  min="1"
                  :max="config.max"
                  class="input-field mt-1"
                />
              </div>
              <span class="text-content-tertiary pt-4">{{ config.label }}</span>
            </div>

            <!-- 列表 -->
            <div v-if="fields[idx].mode === 'list'" class="space-y-2">
              <div class="text-xs text-content-tertiary">输入多个值，用逗号分隔：</div>
              <input
                :value="fields[idx].listValues.join(',')"
                @input="fields[idx].listValues = ($event.target as HTMLInputElement).value.split(',').map(Number).filter(n => !isNaN(n))"
                class="input-field font-mono"
                :placeholder="`如：1,5,10,15`"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 未来执行时间 -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <label class="label-text flex items-center gap-2">
            <Calendar class="h-3.5 w-3.5" />
            未来执行时间
          </label>
          <div class="flex items-center gap-2">
            <CustomSelect
              v-model="nextExecCount"
              :options="[{ label: '5 次', value: 5 }, { label: '10 次', value: 10 }, { label: '20 次', value: 20 }, { label: '50 次', value: 50 }]"
            />
            <button
              @click="showNextExec = !showNextExec"
              class="text-xs text-content-tertiary hover:text-content-secondary flex items-center gap-1 cursor-pointer"
            >
              <component :is="showNextExec ? ChevronUp : ChevronDown" class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div v-if="showNextExec" class="rounded-xl border border-line overflow-hidden">
          <div v-if="nextExecutions.length === 0" class="p-4 text-center text-sm text-content-tertiary">
            无法计算执行时间，请检查表达式
          </div>
          <table v-else class="w-full text-sm">
            <thead>
              <tr class="bg-surface-secondary">
                <th class="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary w-12">#</th>
                <th class="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary">执行时间</th>
                <th class="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary">距今</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(exec, i) in nextExecutions"
                :key="i"
                :class="i < nextExecutions.length - 1 ? 'border-b border-line' : ''"
              >
                <td class="px-4 py-2 text-content-tertiary font-mono text-xs">{{ i + 1 }}</td>
                <td class="px-4 py-2 text-content-primary font-mono text-xs">{{ formatTime(exec) }}</td>
                <td class="px-4 py-2 text-content-secondary text-xs">
                  {{ i === 0 ? '即将执行' : `+${Math.round((exec.getTime() - nextExecutions[0].getTime()) / 60000)} 分钟` }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 重置按钮 -->
      <div class="flex justify-end">
        <button
          @click="resetFields"
          class="btn-secondary inline-flex items-center gap-2"
        >
          <RotateCcw class="h-4 w-4" />
          重置
        </button>
      </div>

      <!-- 使用说明 -->
      <div class="rounded-[12px] bg-surface-secondary border border-line p-4">
        <h3 class="text-xs font-semibold text-content-secondary mb-2">Cron 表达式语法</h3>
        <div class="text-xs text-content-tertiary space-y-1.5">
          <p class="font-mono bg-surface-primary rounded px-2 py-1 inline-block">分 时 日 月 周</p>
          <ul class="space-y-1 mt-2">
            <li>• <span class="font-mono">*</span> - 每个值都匹配（每分钟、每小时等）</li>
            <li>• <span class="font-mono">,</span> - 列出多个值（如 <span class="font-mono">1,3,5</span>）</li>
            <li>• <span class="font-mono">-</span> - 范围（如 <span class="font-mono">1-5</span> 表示 1 到 5）</li>
            <li>• <span class="font-mono">/</span> - 步进（如 <span class="font-mono">*/5</span> 表示每隔 5 单位）</li>
            <li>• 星期：0 和 7 都表示周日，1-6 表示周一到周六</li>
          </ul>
        </div>
      </div>
    </div>
  </ToolCard>
</template>
