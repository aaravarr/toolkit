<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import ToolCard from '../components/ToolCard.vue'
import CopyButton from '../components/CopyButton.vue'
import {
  CircleCheckBig,
  AlertCircle,
} from 'lucide-vue-next'

const idInput = ref('')
const error = ref('')
const targetDateInput = ref('')
const targetDateParsed = ref<dayjs.Dayjs | null>(null)
const targetDateLabel = ref('今天')
const targetDateError = ref('')

// ===== 身份证结构常量 =====
const ID_LENGTH = 18
const ID_LENGTH_OLD = 15

// 校验码加权因子
const WEIGHT_FACTORS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
// 校验码对应值 (余数 0-10 → 校验码)
const CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']

// ===== 省份编码 =====
const PROVINCES: Record<string, string> = {
  '11': '北京市', '12': '天津市', '13': '河北省', '14': '山西省', '15': '内蒙古自治区',
  '21': '辽宁省', '22': '吉林省', '23': '黑龙江省',
  '31': '上海市', '32': '江苏省', '33': '浙江省', '34': '安徽省', '35': '福建省', '36': '江西省', '37': '山东省',
  '41': '河南省', '42': '湖北省', '43': '湖南省', '44': '广东省', '45': '广西壮族自治区', '46': '海南省',
  '50': '重庆市', '51': '四川省', '52': '贵州省', '53': '云南省', '54': '西藏自治区',
  '61': '陕西省', '62': '甘肃省', '63': '青海省', '64': '宁夏回族自治区', '65': '新疆维吾尔自治区',
  '71': '台湾省', '81': '香港特别行政区', '82': '澳门特别行政区', '91': '国外',
}

// ===== 身份证信息接口 =====
interface IdCardInfo {
  raw: string
  regionCode: string
  province: string
  birthDate: string // YYYY-MM-DD
  birthDateFormatted: string
  gender: '男' | '女'
  sequenceCode: string
  checksum: string
  checksumValid: boolean
  age: number
  zodiac: string
  chineseZodiac: string
  isAdult: boolean
}

// ===== 核心：校验码计算（与 Go 实现一致） =====
function calcChecksum(id17: string): string {
  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += parseInt(id17[i]) * WEIGHT_FACTORS[i]
  }
  return CHECK_CODES[sum % 11]
}

// ===== 核心：GetAgeByIdNumberOnDate 的精确复刻 =====
function getAgeByIdNumberOnDate(idCard: string, targetDate: dayjs.Dayjs): number {
  if (idCard.length !== ID_LENGTH) {
    return 0
  }

  // 提取出生日期部分 (Go: idCard[6:14])
  const birthDateStr = idCard.substring(6, 14)

  // 解析出生日期 (Go: time.Parse("20060102", birthDateStr))
  const birthDate = dayjs(birthDateStr, 'YYYYMMDD', true)
  if (!birthDate.isValid()) {
    return 0
  }

  // 计算年龄 (Go: targetDate.Year() - birthDate.Year())
  let age = targetDate.year() - birthDate.year()
  // Go: if targetDate.Format("0102") < birthDate.Format("0102") { age-- }
  if (targetDate.format('MMDD') < birthDate.format('MMDD')) {
    age--
  }

  return age
}

// ===== 生肖 =====
function getChineseZodiac(year: number): string {
  const animals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
  // 1900年是鼠年
  return animals[(year - 1900) % 12]
}

// ===== 星座 =====
function getZodiac(month: number, day: number): string {
  const signs = [
    { name: '摩羯座', end: [1, 19] },
    { name: '水瓶座', end: [2, 18] },
    { name: '双鱼座', end: [3, 20] },
    { name: '白羊座', end: [4, 19] },
    { name: '金牛座', end: [5, 20] },
    { name: '双子座', end: [6, 21] },
    { name: '巨蟹座', end: [7, 22] },
    { name: '狮子座', end: [8, 22] },
    { name: '处女座', end: [9, 22] },
    { name: '天秤座', end: [10, 23] },
    { name: '天蝎座', end: [11, 22] },
    { name: '射手座', end: [12, 21] },
    { name: '摩羯座', end: [12, 31] },
  ]
  for (const sign of signs) {
    if (month < sign.end[0] || (month === sign.end[0] && day <= sign.end[1])) {
      return sign.name
    }
  }
  return '摩羯座'
}

// ===== 智能日期解析（复用时间戳工具逻辑） =====
function parseSmartDate(input: string): { date: dayjs.Dayjs; label: string } | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // 纯数字 → 时间戳
  if (/^\d+$/.test(trimmed)) {
    const num = Number(trimmed)
    if (trimmed.length >= 13) {
      const d = dayjs(num)
      if (d.isValid()) return { date: d, label: d.format('YYYY-MM-DD') }
    }
    if (trimmed.length >= 10) {
      const d = dayjs.unix(num)
      if (d.isValid() && d.year() > 1970 && d.year() < 2100) return { date: d, label: d.format('YYYY-MM-DD') }
      const d2 = dayjs(num)
      if (d2.isValid()) return { date: d2, label: d2.format('YYYY-MM-DD') }
    }
    const d = dayjs.unix(num)
    if (d.isValid() && d.year() > 1970 && d.year() < 2100) return { date: d, label: d.format('YYYY-MM-DD') }
  }

  // ISO 8601
  const iso = dayjs(trimmed)
  if (iso.isValid() && (trimmed.includes('T') || trimmed.includes('Z') || trimmed.includes('+'))) {
    return { date: iso, label: iso.format('YYYY-MM-DD') }
  }

  // 常见格式逐个尝试
  const formats = [
    'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD HH:mm', 'YYYY-MM-DD',
    'YYYY/MM/DD HH:mm:ss', 'YYYY/MM/DD HH:mm', 'YYYY/MM/DD',
    'YYYY年MM月DD日 HH:mm:ss', 'YYYY年MM月DD日 HH:mm', 'YYYY年MM月DD日',
    'MM-DD-YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY', 'DD/MM/YYYY',
    'YYYYMMDDHHmmss', 'YYYYMMDD',
  ]
  for (const fmt of formats) {
    const d = dayjs(trimmed, fmt, true)
    if (d.isValid()) return { date: d, label: d.format('YYYY-MM-DD') }
  }

  // 兜底
  const fallback = dayjs(trimmed)
  if (fallback.isValid()) return { date: fallback, label: fallback.format('YYYY-MM-DD') }

  return null
}

function onTargetDateChange() {
  const trimmed = targetDateInput.value.trim()
  if (!trimmed) {
    targetDateParsed.value = null
    targetDateLabel.value = '今天'
    targetDateError.value = ''
    return
  }
  parseAndSetTargetDate(trimmed)
}

function onTargetDatePaste() {
  // 延迟一帧让 v-model 先更新
  setTimeout(() => parseAndSetTargetDate(targetDateInput.value.trim()), 0)
}

function parseAndSetTargetDate(trimmed: string) {
  if (!trimmed) {
    targetDateParsed.value = null
    targetDateLabel.value = '今天'
    targetDateError.value = ''
    return
  }
  const result = parseSmartDate(trimmed)
  if (result) {
    targetDateParsed.value = result.date
    targetDateLabel.value = result.label
    targetDateError.value = ''
  } else {
    targetDateParsed.value = null
    targetDateLabel.value = ''
    targetDateError.value = '无法识别该时间格式'
  }
}

// ===== 解析身份证 =====
function parseIdCard(id: string, targetDate: dayjs.Dayjs): IdCardInfo | null {
  const trimmed = id.trim().toUpperCase()

  // 15位转18位
  let id18 = trimmed
  if (trimmed.length === ID_LENGTH_OLD) {
    // 15位：插入 "19" (出生年的前两位) + 计算校验码
    id18 = trimmed.substring(0, 6) + '19' + trimmed.substring(6)
    id18 += calcChecksum(id18.substring(0, 17))
  }

  if (id18.length !== ID_LENGTH) {
    return null
  }

  // 提取各部分
  const regionCode = id18.substring(0, 6)
  const birthDateStr = id18.substring(6, 14) // YYYYMMDD
  const sequenceCode = id18.substring(14, 17)
  const checksum = id18[17]

  // 省份
  const province = PROVINCES[regionCode.substring(0, 2)] || '未知'

  // 出生日期
  const birthDate = dayjs(birthDateStr, 'YYYYMMDD', true)
  if (!birthDate.isValid()) {
    return null
  }

  // 校验码验证
  const expectedChecksum = calcChecksum(id18.substring(0, 17))
  const checksumValid = checksum === expectedChecksum

  // 性别（第17位奇数=男，偶数=女）
  const seqNum = parseInt(sequenceCode)
  const gender: '男' | '女' = seqNum % 2 === 1 ? '男' : '女'

  // 年龄（精确复刻 Go 函数：GetAgeByIdNumberOnDate）
  const age = getAgeByIdNumberOnDate(id18, targetDate)

  // 生肖
  const chineseZodiac = getChineseZodiac(birthDate.year())

  // 星座
  const zodiac = getZodiac(birthDate.month() + 1, birthDate.date())

  return {
    raw: id18,
    regionCode,
    province,
    birthDate: birthDate.format('YYYY-MM-DD'),
    birthDateFormatted: birthDate.format('YYYY年MM月DD日'),
    gender,
    sequenceCode,
    checksum,
    checksumValid,
    age,
    zodiac,
    chineseZodiac,
    isAdult: age >= 18,
  }
}

// ===== 响应式解析 =====
const info = computed<IdCardInfo | null>(() => {
  error.value = ''
  const trimmed = idInput.value.trim()
  if (!trimmed) return null

  if (trimmed.length !== ID_LENGTH && trimmed.length !== ID_LENGTH_OLD) {
    error.value = `请输入15位或18位身份证号码，当前 ${trimmed.length} 位`
    return null
  }

  if (!/^\d{15}(\d{2}[\dXx])?$/.test(trimmed)) {
    error.value = '身份证号码格式错误，应为15-18位数字（末位可为X）'
    return null
  }

  // 解析目标日期，默认当前时间
  const td = targetDateParsed.value || dayjs()
  if (!td.isValid()) {
    error.value = '请输入有效的日期'
    return null
  }

  const result = parseIdCard(trimmed, td)
  if (!result) {
    error.value = '身份证号码无效，请检查出生日期是否正确'
    return null
  }

  return result
})

// ===== 所有信息项 =====
const infoItems = computed(() => {
  if (!info.value) return []
  const i = info.value
  return [
    { label: '号码', value: i.raw, mono: true, copyable: true },
    { label: '省份', value: i.province, icon: 'map' },
    { label: '地区编码', value: i.regionCode, mono: true },
    { label: '出生日期', value: i.birthDateFormatted, icon: 'calendar' },
    { label: '性别', value: i.gender, icon: 'user' },
    { label: '年龄', value: `${i.age} 岁${i.isAdult ? '（已成年）' : '（未成年）'}${targetDateParsed.value ? `（截至 ${targetDateLabel.value}）` : ''}`, icon: 'user' },
    { label: '生肖', value: i.chineseZodiac },
    { label: '星座', value: i.zodiac },
    { label: '顺序码', value: i.sequenceCode, mono: true },
    { label: '校验码', value: `${i.checksum}（${i.checksumValid ? '校验通过' : '校验失败'}）`, mono: true },
  ]
})
</script>

<template>
  <ToolCard title="身份证信息提取" description="输入18位或15位身份证号码，自动提取地区、年龄、性别等信息，校验码验证">

    <div class="space-y-6">

      <!-- 输入区 -->
      <div>
        <label class="label-text">身份证号码</label>
        <input
          v-model="idInput"
          class="input-field font-mono tracking-wider"
          placeholder="请输入15位或18位身份证号码"
          maxlength="18"
        />
      </div>

      <!-- 指定计算日期 -->
      <div>
        <label class="label-text">计算年龄的日期（默认今天）</label>
        <input
          v-model="targetDateInput"
          @input="onTargetDateChange"
          @paste="onTargetDatePaste"
          class="input-field font-mono sm:w-96"
          placeholder="粘贴或输入时间，如：2024-06-08、1717843200000"
        />
        <div v-if="targetDateError" class="mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle class="h-3.5 w-3.5 shrink-0" />
          {{ targetDateError }}
        </div>
        <div v-else-if="targetDateParsed" class="mt-1.5 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
          <CircleCheckBig class="h-3.5 w-3.5 shrink-0" />
          解析为 {{ targetDateParsed.format('YYYY-MM-DD HH:mm:ss') }}
        </div>
        <p v-else class="mt-1.5 text-xs text-content-tertiary">
          支持时间戳、YYYY-MM-DD、YYYY/MM/DD 等常见格式，留空则使用当前时间
        </p>
      </div>

      <!-- 状态提示 -->
      <div v-if="error" class="flex items-center gap-1.5 text-xs text-red-500">
        <ExclamationCircleIcon class="h-3.5 w-3.5 shrink-0" />
        {{ error }}
      </div>
      <div v-if="info && !error" class="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
        <CheckCircleIcon class="h-3.5 w-3.5 shrink-0" />
        解析成功
        <span v-if="!info.checksumValid" class="text-amber-600 dark:text-amber-400 ml-1">（校验码不匹配，号码可能有误）</span>
      </div>

      <!-- 结果面板 -->
      <div v-if="info" class="rounded-[12px] border border-line overflow-hidden animate-fade-in">
        <table class="w-full text-sm">
          <tbody>
            <tr
              v-for="(item, idx) in infoItems"
              :key="item.label"
              :class="idx < infoItems.length - 1 ? 'border-b border-line' : ''"
            >
              <td class="px-4 py-2.5 text-content-tertiary w-28 whitespace-nowrap">
                {{ item.label }}
              </td>
              <td class="px-4 py-2.5 text-content-primary" :class="item.mono ? 'font-mono' : ''">
                {{ item.value }}
              </td>
              <td v-if="item.copyable" class="px-4 py-2.5 w-16 text-right">
                <CopyButton :text="item.value" label="" size="sm" />
              </td>
              <td v-else class="w-4"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 使用说明 -->
      <div class="rounded-[12px] bg-surface-secondary border border-line p-4">
        <h3 class="text-xs font-semibold text-content-secondary mb-2">支持格式</h3>
        <ul class="text-xs text-content-tertiary space-y-1">
          <li>• <span class="font-mono">18位</span>：110101199003074518（最后一位可为X）</li>
          <li>• <span class="font-mono">15位</span>：110101900307451（自动转换为18位）</li>
        </ul>
        <h3 class="text-xs font-semibold text-content-secondary mt-3 mb-2">可提取信息</h3>
        <ul class="text-xs text-content-tertiary space-y-1">
          <li>• 省份、地区编码</li>
          <li>• 出生日期、年龄、是否成年</li>
          <li>• 性别（奇数=男，偶数=女）</li>
          <li>• 生肖、星座</li>
          <li>• 校验码验证</li>
        </ul>
      </div>

    </div>
  </ToolCard>
</template>
