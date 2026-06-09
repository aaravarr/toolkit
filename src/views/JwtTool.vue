<script setup lang="ts">
import { ref, computed } from 'vue'
import ToolCard from '../components/ToolCard.vue'
import CopyButton from '../components/CopyButton.vue'
import { Clock, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-vue-next'

// ===== JWT 输入 =====
const jwtInput = ref('')

// ===== Base64URL 解码 =====
function base64UrlDecode(str: string): string {
  // 补齐 padding
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  if (pad) base64 += '='.repeat(4 - pad)
  return decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  )
}

// ===== 解析结果 =====
interface JwtParsed {
  header: Record<string, any> | null
  payload: Record<string, any> | null
  signature: string
  headerRaw: string
  payloadRaw: string
  signatureRaw: string
  error: string | null
}

const parsed = computed<JwtParsed>(() => {
  const token = jwtInput.value.trim()
  if (!token) {
    return { header: null, payload: null, signature: '', headerRaw: '', payloadRaw: '', signatureRaw: '', error: null }
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    return { header: null, payload: null, signature: '', headerRaw: '', payloadRaw: '', signatureRaw: '', error: 'JWT 格式错误：Token 应包含三个由 "." 分隔的部分' }
  }

  try {
    const header = JSON.parse(base64UrlDecode(parts[0]))
    const payload = JSON.parse(base64UrlDecode(parts[1]))
    const signature = parts[2]
    return {
      header,
      payload,
      signature,
      headerRaw: parts[0],
      payloadRaw: parts[1],
      signatureRaw: parts[2],
      error: null,
    }
  } catch {
    return { header: null, payload: null, signature: '', headerRaw: '', payloadRaw: '', signatureRaw: '', error: 'JWT 解码失败：Header 或 Payload 不是有效的 JSON' }
  }
})

// ===== 时间相关 =====
const timeFields = ['exp', 'iat', 'nbf']

function formatTimestamp(ts: number): string {
  try {
    const date = new Date(ts * 1000)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return '无效时间'
  }
}

// ===== 过期状态 =====
const expiryInfo = computed(() => {
  const exp = parsed.value.payload?.exp
  if (typeof exp !== 'number') return null

  const now = Math.floor(Date.now() / 1000)
  const diff = exp - now
  const absDiff = Math.abs(diff)

  const days = Math.floor(absDiff / 86400)
  const hours = Math.floor((absDiff % 86400) / 3600)
  const minutes = Math.floor((absDiff % 3600) / 60)

  let timeStr = ''
  if (days > 0) timeStr += `${days}天`
  if (hours > 0) timeStr += `${hours}小时`
  if (minutes > 0 || (!days && !hours)) timeStr += `${minutes}分钟`

  return {
    expired: diff < 0,
    timeStr,
    fullDate: formatTimestamp(exp),
  }
})

// ===== nbf 状态 =====
const nbfInfo = computed(() => {
  const nbf = parsed.value.payload?.nbf
  if (typeof nbf !== 'number') return null
  const now = Math.floor(Date.now() / 1000)
  return {
    active: nbf <= now,
    fullDate: formatTimestamp(nbf),
  }
})

// ===== JSON 语法高亮 =====
function highlightJson(obj: Record<string, any>): string {
  const json = JSON.stringify(obj, null, 2)
  return json
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    // 字符串值
    .replace(
      /("(?:[^"\\]|\\.)*")\s*:/g,
      '<span class="text-[var(--accent)]">$1</span>:'
    )
    .replace(
      /:\s*("(?:[^"\\]|\\.)*")/g,
      ': <span class="text-emerald-600 dark:text-emerald-400">$1</span>'
    )
    // 数字
    .replace(
      /:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
      ': <span class="text-amber-600 dark:text-amber-400">$1</span>'
    )
    // 布尔和 null
    .replace(
      /:\s*(true|false|null)/g,
      ': <span class="text-purple-600 dark:text-purple-400">$1</span>'
    )
}

// ===== 格式化 JSON（带时间戳注释） =====
function formatJsonWithTimestamps(obj: Record<string, any>): string {
  const json = JSON.stringify(obj, null, 2)
  let highlighted = json
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    // key
    .replace(
      /("(?:[^"\\]|\\.)*")\s*:/g,
      '<span class="text-[var(--accent)]">$1</span>:'
    )
    // string value
    .replace(
      /:\s*("(?:[^"\\]|\\.)*")/g,
      ': <span class="text-emerald-600 dark:text-emerald-400">$1</span>'
    )
    // number
    .replace(
      /:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
      ': <span class="text-amber-600 dark:text-amber-400">$1</span>'
    )
    // boolean / null
    .replace(
      /:\s*(true|false|null)/g,
      ': <span class="text-purple-600 dark:text-purple-400">$1</span>'
    )

  // 为时间戳字段追加可读时间注释
  for (const key of timeFields) {
    const val = obj[key]
    if (typeof val === 'number') {
      const regex = new RegExp(
        `(<span class="text-\\[var\\(--accent\\)\\]">"${key}"</span>:\\s*<span class="text-amber-600 dark:text-amber-400">)(\\d+)(</span>)`
      )
      highlighted = highlighted.replace(regex, `$1$2$3 <span class="text-content-tertiary">/* ${formatTimestamp(val)} */</span>`)
    }
  }

  return highlighted
}

// ===== 自动检测粘贴 =====
function onPaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text')?.trim()
  if (text && text.split('.').length === 3) {
    // 看起来是 JWT，让默认行为处理
    return
  }
}

// ===== 示例 JWT =====
const exampleJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IuWwj+eZuuiNrSIsImlzcyI6Imh0dHBzOi8vZXhhbXBsZS5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTczMTUzNjAwMCwiYWRtaW4iOnRydWUsInJvbGVzIjpbInVzZXIiLCJhZG1pbiJdfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

function loadExample() {
  jwtInput.value = exampleJwt
}

function clearInput() {
  jwtInput.value = ''
}
</script>

<template>
  <ToolCard title="JWT 解析器" description="在线解码 JWT Token，查看 Header、Payload、过期时间等信息">

    <div class="space-y-8">

      <!-- ===== 输入区 ===== -->
      <section>
        <div class="flex items-center justify-between mb-2">
          <label class="label-text">JWT Token</label>
          <div class="flex items-center gap-2">
            <button @click="loadExample" class="btn-secondary text-xs !py-1 !px-2.5">
              加载示例
            </button>
            <button
              v-if="jwtInput"
              @click="clearInput"
              class="btn-secondary text-xs !py-1 !px-2.5"
            >
              清除
            </button>
          </div>
        </div>
        <textarea
          v-model="jwtInput"
          class="textarea-field font-mono text-xs h-40"
          placeholder="粘贴 JWT Token（格式：xxxxx.yyyyy.zzzzz）"
          @paste="onPaste"
          spellcheck="false"
        />
      </section>

      <!-- ===== 错误提示 ===== -->
      <div
        v-if="parsed.error"
        class="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
      >
        <AlertTriangle class="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-semibold text-red-700 dark:text-red-400">解析错误</p>
          <p class="text-xs text-red-600 dark:text-red-400/80 mt-1">{{ parsed.error }}</p>
        </div>
      </div>

      <!-- ===== 过期状态栏 ===== -->
      <div
        v-if="expiryInfo"
        :class="[
          'flex items-center gap-3 p-4 rounded-xl border',
          expiryInfo.expired
            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
            : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
        ]"
      >
        <ShieldAlert v-if="expiryInfo.expired" class="h-5 w-5 text-red-500 shrink-0" />
        <ShieldCheck v-else class="h-5 w-5 text-green-500 shrink-0" />
        <div>
          <p
            :class="[
              'text-sm font-semibold',
              expiryInfo.expired ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400',
            ]"
          >
            {{ expiryInfo.expired ? `已过期 ${expiryInfo.timeStr}` : `还有 ${expiryInfo.timeStr} 过期` }}
          </p>
          <p class="text-xs text-content-tertiary mt-0.5">
            过期时间：{{ expiryInfo.fullDate }}
          </p>
        </div>
      </div>

      <!-- ===== nbf 状态栏 ===== -->
      <div
        v-if="nbfInfo && !nbfInfo.active"
        class="flex items-center gap-3 p-4 rounded-xl border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
      >
        <Clock class="h-5 w-5 text-amber-500 shrink-0" />
        <div>
          <p class="text-sm font-semibold text-amber-700 dark:text-amber-400">
            Token 尚未生效
          </p>
          <p class="text-xs text-content-tertiary mt-0.5">
            生效时间：{{ nbfInfo.fullDate }}
          </p>
        </div>
      </div>

      <!-- ===== 解析结果三栏 ===== -->
      <section v-if="parsed.header || parsed.payload">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <!-- Header -->
          <div v-if="parsed.header" class="rounded-xl border border-line overflow-hidden">
            <div class="flex items-center justify-between px-4 py-2.5 bg-surface-secondary border-b border-line">
              <span class="text-xs font-semibold text-content-secondary">Header</span>
              <CopyButton :text="JSON.stringify(parsed.header, null, 2)" label="" size="sm" />
            </div>
            <div class="p-4 overflow-x-auto">
              <pre class="text-xs font-mono leading-relaxed whitespace-pre-wrap break-all text-content-primary"><code v-html="highlightJson(parsed.header)" /></pre>
            </div>
          </div>

          <!-- Payload -->
          <div v-if="parsed.payload" class="rounded-xl border border-line overflow-hidden">
            <div class="flex items-center justify-between px-4 py-2.5 bg-surface-secondary border-b border-line">
              <span class="text-xs font-semibold text-content-secondary">Payload</span>
              <CopyButton :text="JSON.stringify(parsed.payload, null, 2)" label="" size="sm" />
            </div>
            <div class="p-4 overflow-x-auto">
              <pre class="text-xs font-mono leading-relaxed whitespace-pre-wrap break-all text-content-primary"><code v-html="formatJsonWithTimestamps(parsed.payload)" /></pre>
            </div>
          </div>

          <!-- Signature -->
          <div class="rounded-xl border border-line overflow-hidden">
            <div class="flex items-center justify-between px-4 py-2.5 bg-surface-secondary border-b border-line">
              <span class="text-xs font-semibold text-content-secondary">Signature</span>
              <CopyButton :text="parsed.signature" label="" size="sm" />
            </div>
            <div class="p-4 space-y-3">
              <div>
                <p class="text-[10px] text-content-tertiary mb-1.5">签名（Base64URL）</p>
                <pre class="text-xs font-mono break-all text-content-primary bg-surface-secondary rounded-lg p-3">{{ parsed.signature }}</pre>
              </div>
              <div
                :class="[
                  'flex items-center gap-2 p-3 rounded-lg text-xs',
                  'bg-surface-secondary',
                ]"
              >
                <ShieldAlert class="h-4 w-4 text-amber-500 shrink-0" />
                <span class="text-content-secondary">
                  签名验证需要密钥，此工具仅做解码展示，不验证签名有效性。
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- ===== Payload 字段说明 ===== -->
      <section v-if="parsed.payload">
        <h2 class="text-sm font-semibold text-content-secondary mb-3 flex items-center gap-1.5">
          <Clock class="h-4 w-4" />
          标准字段说明
        </h2>
        <div class="rounded-xl border border-line overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-line bg-surface-secondary">
                <th class="px-4 py-2.5 text-left text-xs font-semibold text-content-secondary w-24">字段</th>
                <th class="px-4 py-2.5 text-left text-xs font-semibold text-content-secondary">值</th>
                <th class="px-4 py-2.5 text-left text-xs font-semibold text-content-secondary">说明</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="info in [
                { key: 'iss', label: '签发者', value: parsed.payload?.iss },
                { key: 'sub', label: '主题', value: parsed.payload?.sub },
                { key: 'aud', label: '受众', value: parsed.payload?.aud },
                { key: 'exp', label: '过期时间', value: parsed.payload?.exp, isTime: true },
                { key: 'nbf', label: '生效时间', value: parsed.payload?.nbf, isTime: true },
                { key: 'iat', label: '签发时间', value: parsed.payload?.iat, isTime: true },
                { key: 'jti', label: 'JWT ID', value: parsed.payload?.jti },
              ]" :key="info.key">
                <tr v-if="info.value !== undefined" class="border-b border-line last:border-b-0 hover:bg-surface-secondary/50 transition-colors">
                  <td class="px-4 py-2.5 font-mono text-xs font-semibold text-[var(--accent)]">{{ info.key }}</td>
                  <td class="px-4 py-2.5 font-mono text-xs text-content-primary break-all">
                    {{ info.isTime && typeof info.value === 'number' ? formatTimestamp(info.value) : String(info.value) }}
                    <span v-if="info.isTime && typeof info.value === 'number'" class="text-content-tertiary ml-1">({{ info.value }})</span>
                  </td>
                  <td class="px-4 py-2.5 text-xs text-content-tertiary">{{ info.label }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ===== 使用说明 ===== -->
      <div class="rounded-xl bg-surface-secondary border border-line p-4">
        <h3 class="text-xs font-semibold text-content-secondary mb-2">使用说明</h3>
        <ul class="text-xs text-content-tertiary space-y-1">
          <li>JWT（JSON Web Token）由 Header、Payload、Signature 三部分组成，以 "." 分隔</li>
          <li>本工具在浏览器本地完成解码，Token 不会上传到服务器</li>
          <li>签名验证需要对应的密钥，本工具仅展示签名原文，不进行验证</li>
          <li>过期时间（exp）、签发时间（iat）、生效时间（nbf）会自动转为可读格式</li>
          <li>支持所有标准的 JWT 算法（HS256、RS256、ES256 等）的解码查看</li>
        </ul>
      </div>

    </div>
  </ToolCard>
</template>
