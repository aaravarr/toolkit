<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import QRCode from 'qrcode'
import type { QRCodeErrorCorrectionLevel } from 'qrcode'
import ToolCard from '../components/ToolCard.vue'
import CustomSelect from '../components/CustomSelect.vue'
import {
  Download,
  RotateCcw,
  Palette,
  Settings2,
  QrCode,
  Type,
  Link,
  MessageSquare,
  Wifi,
  Mail,
  Phone,
} from 'lucide-vue-next'

// ===== 内容类型 =====
type ContentType = 'text' | 'url' | 'wifi' | 'email' | 'phone' | 'sms'

const contentTypes: { key: ContentType; label: string; icon: any; placeholder: string }[] = [
  { key: 'text', label: '文本', icon: Type, placeholder: '输入任意文本内容' },
  { key: 'url', label: '网址', icon: Link, placeholder: 'https://example.com' },
  { key: 'wifi', label: 'WiFi', icon: Wifi, placeholder: '' },
  { key: 'email', label: '邮箱', icon: Mail, placeholder: 'user@example.com' },
  { key: 'phone', label: '电话', icon: Phone, placeholder: '+86 13800138000' },
  { key: 'sms', label: '短信', icon: MessageSquare, placeholder: '' },
]

// ===== 状态 =====
const contentType = ref<ContentType>('text')
const textInput = ref('https://github.com')
const wifiSSID = ref('')
const wifiPassword = ref('')
const wifiEncryption = ref<'WPA' | 'WEP' | 'nopass'>('WPA')
const wifiHidden = ref(false)
const emailAddress = ref('')
const emailSubject = ref('')
const emailBody = ref('')
const phoneNumber = ref('')
const smsNumber = ref('')
const smsMessage = ref('')

// 选项
const size = ref(300)
const errorCorrectionLevel = ref<QRCodeErrorCorrectionLevel>('M')
const margin = ref(4)
const foregroundColor = ref('#000000')
const backgroundColor = ref('#ffffff')
const transparentBg = ref(false)

// 预览
const qrDataUrl = ref('')
const isGenerating = ref(false)

// ===== 预设尺寸 =====
const sizePresets = [
  { label: '小 (200px)', value: 200 },
  { label: '中 (300px)', value: 300 },
  { label: '大 (500px)', value: 500 },
  { label: '超大 (800px)', value: 800 },
  { label: '1024px', value: 1024 },
]

// ===== 纠错等级 =====
const correctionLevels: { value: QRCodeErrorCorrectionLevel; label: string; desc: string }[] = [
  { value: 'L', label: 'L (7%)', desc: '低，适合清晰环境' },
  { value: 'M', label: 'M (15%)', desc: '中，推荐日常使用' },
  { value: 'Q', label: 'Q (25%)', desc: '较高，适合打印' },
  { value: 'H', label: 'H (30%)', desc: '最高，适合添加Logo' },
]

// ===== 内容类型特殊标签 =====
const correctionLabels = computed(() => correctionLevels)

// ===== 生成二维码内容字符串 =====
const qrContent = computed(() => {
  switch (contentType.value) {
    case 'text':
      return textInput.value
    case 'url':
      return textInput.value
    case 'wifi':
      return `WIFI:T:${wifiEncryption.value};S:${wifiSSID.value};P:${wifiPassword.value};H:${wifiHidden.value ? 'true' : 'false'};;`
    case 'email':
      return `mailto:${emailAddress.value}${emailSubject.value || emailBody.value ? '?' : ''}${emailSubject.value ? `subject=${encodeURIComponent(emailSubject.value)}` : ''}${emailSubject.value && emailBody.value ? '&' : ''}${emailBody.value ? `body=${encodeURIComponent(emailBody.value)}` : ''}`
    case 'phone':
      return `tel:${phoneNumber.value}`
    case 'sms':
      return `sms:${smsNumber.value}${smsMessage.value ? `?body=${encodeURIComponent(smsMessage.value)}` : ''}`
    default:
      return textInput.value
  }
})

// ===== 生成二维码 =====
async function generateQR() {
  if (!qrContent.value.trim()) {
    qrDataUrl.value = ''
    return
  }

  isGenerating.value = true
  try {
    const options: QRCode.QRCodeToDataURLOptions = {
      errorCorrectionLevel: errorCorrectionLevel.value,
      margin: margin.value,
      width: size.value,
      color: {
        dark: foregroundColor.value,
        light: transparentBg.value ? '#00000000' : backgroundColor.value,
      },
    }
    qrDataUrl.value = await QRCode.toDataURL(qrContent.value, options)
  } catch (err) {
    console.error('QR generation error:', err)
    qrDataUrl.value = ''
  } finally {
    isGenerating.value = false
  }
}

// ===== 防抖生成 =====
let debounceTimer: ReturnType<typeof setTimeout> | null = null
function debouncedGenerate() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(generateQR, 300)
}

// 监听所有输入变化
watch(
  [qrContent, size, errorCorrectionLevel, margin, foregroundColor, backgroundColor, transparentBg],
  debouncedGenerate,
  { immediate: true }
)

// ===== 下载 =====
function downloadPNG() {
  if (!qrDataUrl.value) return
  const link = document.createElement('a')
  link.download = `qrcode-${Date.now()}.png`
  link.href = qrDataUrl.value
  link.click()
}

function downloadSVG() {
  if (!qrContent.value.trim()) return
  QRCode.toString(qrContent.value, {
    type: 'svg',
    errorCorrectionLevel: errorCorrectionLevel.value,
    margin: margin.value,
    width: size.value,
    color: {
      dark: foregroundColor.value,
      light: transparentBg.value ? '#00000000' : backgroundColor.value,
    },
  }).then((svg) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `qrcode-${Date.now()}.svg`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  })
}

// ===== 重置 =====
function resetOptions() {
  size.value = 300
  errorCorrectionLevel.value = 'M'
  margin.value = 4
  foregroundColor.value = '#000000'
  backgroundColor.value = '#ffffff'
  transparentBg.value = false
}

// ===== 当前内容类型的配置 =====
const currentPlaceholder = computed(() => {
  return contentTypes.find((t) => t.key === contentType.value)?.placeholder || ''
})

const showTextInput = computed(() => ['text', 'url'].includes(contentType.value))
</script>

<template>
  <ToolCard title="二维码生成器" description="支持文本、网址、WiFi、邮箱、电话等多种内容类型的二维码生成，支持自定义样式和下载">
    <div class="space-y-6">
      <!-- 内容类型选择 -->
      <div>
        <label class="label-text">内容类型</label>
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="ct in contentTypes"
            :key="ct.key"
            @click="contentType = ct.key"
            :class="[
              'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer',
              contentType === ct.key
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'bg-surface-secondary text-content-secondary hover:bg-surface-primary border border-line',
            ]"
          >
            <component :is="ct.icon" class="h-4 w-4" />
            {{ ct.label }}
          </button>
        </div>
      </div>

      <!-- 内容输入 -->
      <div class="space-y-4">
        <!-- 文本/URL输入 -->
        <div v-if="showTextInput">
          <label class="label-text">{{ contentType === 'url' ? '网址' : '文本内容' }}</label>
          <textarea
            v-model="textInput"
            class="textarea-field font-mono"
            :placeholder="currentPlaceholder"
            rows="3"
          ></textarea>
        </div>

        <!-- WiFi输入 -->
        <div v-if="contentType === 'wifi'" class="space-y-3">
          <div>
            <label class="label-text">网络名称 (SSID)</label>
            <input v-model="wifiSSID" class="input-field" placeholder="MyWiFi" />
          </div>
          <div>
            <label class="label-text">密码</label>
            <input v-model="wifiPassword" class="input-field" type="password" placeholder="输入WiFi密码" />
          </div>
          <div class="flex gap-4">
            <div class="flex-1">
              <label class="label-text">加密方式</label>
              <CustomSelect
                v-model="wifiEncryption"
                :options="[{ label: 'WPA/WPA2', value: 'WPA' }, { label: 'WEP', value: 'WEP' }, { label: '无密码', value: 'nopass' }]"
              />
            </div>
            <div class="flex items-end pb-1">
              <label class="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="wifiHidden" class="rounded border-line" />
                <span class="text-sm text-content-secondary">隐藏网络</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 邮箱输入 -->
        <div v-if="contentType === 'email'" class="space-y-3">
          <div>
            <label class="label-text">邮箱地址</label>
            <input v-model="emailAddress" class="input-field" placeholder="user@example.com" />
          </div>
          <div>
            <label class="label-text">主题（可选）</label>
            <input v-model="emailSubject" class="input-field" placeholder="邮件主题" />
          </div>
          <div>
            <label class="label-text">内容（可选）</label>
            <textarea v-model="emailBody" class="textarea-field" placeholder="邮件正文" rows="2"></textarea>
          </div>
        </div>

        <!-- 电话输入 -->
        <div v-if="contentType === 'phone'">
          <label class="label-text">电话号码</label>
          <input v-model="phoneNumber" class="input-field font-mono" placeholder="+86 13800138000" />
        </div>

        <!-- 短信输入 -->
        <div v-if="contentType === 'sms'" class="space-y-3">
          <div>
            <label class="label-text">手机号码</label>
            <input v-model="smsNumber" class="input-field font-mono" placeholder="13800138000" />
          </div>
          <div>
            <label class="label-text">短信内容（可选）</label>
            <textarea v-model="smsMessage" class="textarea-field" placeholder="短信内容" rows="2"></textarea>
          </div>
        </div>
      </div>

      <!-- 预览和选项 - 左右布局 -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- 左侧：二维码预览 -->
        <div class="space-y-4">
          <div
            class="flex items-center justify-center rounded-xl border border-line p-6 min-h-[280px]"
            :class="transparentBg ? 'bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]' : 'bg-white'"
          >
            <div v-if="isGenerating" class="text-content-tertiary text-sm">生成中...</div>
            <div v-else-if="!qrContent.trim()" class="text-content-tertiary text-sm text-center">
              <QrCode class="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>请输入内容以生成二维码</p>
            </div>
            <img
              v-else-if="qrDataUrl"
              :src="qrDataUrl"
              alt="QR Code"
              class="max-w-full max-h-[320px] rounded-lg shadow-sm"
            />
          </div>
          <!-- 下载按钮 -->
          <div class="flex gap-3">
            <button
              @click="downloadPNG"
              :disabled="!qrDataUrl"
              class="btn-primary flex-1 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download class="h-4 w-4" />
              下载 PNG
            </button>
            <button
              @click="downloadSVG"
              :disabled="!qrContent.trim()"
              class="btn-secondary flex-1 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download class="h-4 w-4" />
              下载 SVG
            </button>
          </div>
        </div>

        <!-- 右侧：选项面板 -->
        <div class="space-y-5">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-content-secondary flex items-center gap-2">
              <Settings2 class="h-4 w-4" />
              生成选项
            </h3>
            <button @click="resetOptions" class="text-xs text-content-tertiary hover:text-content-secondary flex items-center gap-1 cursor-pointer">
              <RotateCcw class="h-3.5 w-3.5" />
              重置
            </button>
          </div>

          <!-- 尺寸 -->
          <div>
            <label class="label-text">尺寸</label>
            <div class="mt-1.5 flex flex-wrap gap-2">
              <button
                v-for="preset in sizePresets"
                :key="preset.value"
                @click="size = preset.value"
                :class="[
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  size === preset.value
                    ? 'bg-accent-soft text-accent ring-1 ring-accent/30'
                    : 'bg-surface-secondary text-content-secondary hover:bg-surface-primary border border-line',
                ]"
              >
                {{ preset.label }}
              </button>
            </div>
            <div class="mt-2 flex items-center gap-3">
              <input
                type="range"
                v-model.number="size"
                min="100"
                max="1024"
                step="10"
                class="flex-1 h-2 bg-surface-tertiary rounded-lg appearance-none cursor-pointer"
              />
              <span class="text-xs text-content-tertiary w-16 text-right font-mono">{{ size }}px</span>
            </div>
          </div>

          <!-- 纠错等级 -->
          <div>
            <label class="label-text">纠错等级</label>
            <div class="mt-1.5 grid grid-cols-2 gap-2">
              <button
                v-for="cl in correctionLabels"
                :key="cl.value"
                @click="errorCorrectionLevel = cl.value"
                :class="[
                  'px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer',
                  errorCorrectionLevel === cl.value
                    ? 'bg-accent-soft text-accent ring-1 ring-accent/30'
                    : 'bg-surface-secondary text-content-secondary hover:bg-surface-primary border border-line',
                ]"
              >
                <div class="font-semibold">{{ cl.label }}</div>
                <div class="text-content-tertiary mt-0.5">{{ cl.desc }}</div>
              </button>
            </div>
          </div>

          <!-- 边距 -->
          <div>
            <label class="label-text">边距（模块数）</label>
            <div class="mt-1.5 flex items-center gap-3">
              <input
                type="range"
                v-model.number="margin"
                min="0"
                max="10"
                step="1"
                class="flex-1 h-2 bg-surface-tertiary rounded-lg appearance-none cursor-pointer"
              />
              <span class="text-xs text-content-tertiary w-8 text-right font-mono">{{ margin }}</span>
            </div>
          </div>

          <!-- 颜色 -->
          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-content-secondary flex items-center gap-2">
              <Palette class="h-4 w-4" />
              颜色设置
            </h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label-text">前景色</label>
                <div class="mt-1.5 flex items-center gap-2">
                  <input
                    type="color"
                    v-model="foregroundColor"
                    class="w-10 h-10 rounded-lg cursor-pointer border border-line"
                  />
                  <input
                    v-model="foregroundColor"
                    class="input-field font-mono text-xs flex-1"
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div>
                <label class="label-text">背景色</label>
                <div class="mt-1.5 flex items-center gap-2">
                  <input
                    type="color"
                    :value="transparentBg ? '#ffffff' : backgroundColor"
                    :disabled="transparentBg"
                    @input="backgroundColor = ($event.target as HTMLInputElement).value"
                    class="w-10 h-10 rounded-lg cursor-pointer border border-line disabled:opacity-50"
                  />
                  <input
                    v-model="backgroundColor"
                    :disabled="transparentBg"
                    class="input-field font-mono text-xs flex-1 disabled:opacity-50"
                    placeholder="#ffffff"
                  />
                </div>
                <label class="mt-2 inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="transparentBg" class="rounded border-line" />
                  <span class="text-xs text-content-secondary">透明背景</span>
                </label>
              </div>
            </div>
          </div>

          <!-- 颜色快捷预设 -->
          <div>
            <label class="label-text">配色预设</label>
            <div class="mt-1.5 flex flex-wrap gap-2">
              <button
                v-for="preset in [
                  { fg: '#000000', bg: '#ffffff', label: '经典黑白' },
                  { fg: '#1e40af', bg: '#dbeafe', label: '蓝色' },
                  { fg: '#15803d', bg: '#dcfce7', label: '绿色' },
                  { fg: '#b91c1c', bg: '#fee2e2', label: '红色' },
                  { fg: '#7e22ce', bg: '#f3e8ff', label: '紫色' },
                  { fg: '#c2410c', bg: '#fff7ed', label: '橙色' },
                ]"
                :key="preset.label"
                @click="foregroundColor = preset.fg; backgroundColor = preset.bg; transparentBg = false"
                class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border border-line hover:border-accent/50 transition-all cursor-pointer"
              >
                <span class="w-4 h-4 rounded-full border border-line" :style="{ backgroundColor: preset.fg }"></span>
                <span class="w-4 h-4 rounded-full border border-line" :style="{ backgroundColor: preset.bg }"></span>
                <span class="text-content-secondary">{{ preset.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="rounded-[12px] bg-surface-secondary border border-line p-4">
        <h3 class="text-xs font-semibold text-content-secondary mb-2">使用说明</h3>
        <ul class="text-xs text-content-tertiary space-y-1">
          <li>• 支持文本、网址、WiFi、邮箱、电话、短信等多种内容类型</li>
          <li>• WiFi 扫码后可自动连接，无需手动输入密码</li>
          <li>• 纠错等级越高，二维码越复杂，但容错能力越强（添加Logo建议使用 H 级别）</li>
          <li>• 支持 PNG 和 SVG 两种格式下载，SVG 适合打印场景</li>
          <li>• 透明背景适合将二维码叠加在其他图片上使用</li>
        </ul>
      </div>
    </div>
  </ToolCard>
</template>
