<script setup lang="ts">
import { ref, computed } from 'vue'
import CryptoJS from 'crypto-js'
import ToolCard from '../components/ToolCard.vue'
import CopyButton from '../components/CopyButton.vue'
import {
  Hash,
  CaseSensitive,
  CaseUpper,
  KeyRound,
  FileText,
} from 'lucide-vue-next'

// ===== 输入 =====
const inputText = ref('')
const isHmacMode = ref(false)
const hmacKey = ref('')
const isUppercase = ref(false)

// ===== 算法配置 =====
interface HashAlgo {
  id: string
  name: string
  fn: (msg: string, key?: string) => string
  description: string
}

const algorithms: HashAlgo[] = [
  {
    id: 'md5',
    name: 'MD5',
    fn: (msg, key) => {
      if (isHmacMode.value && key) return CryptoJS.HmacMD5(msg, key).toString()
      return CryptoJS.MD5(msg).toString()
    },
    description: '128位，常用于文件校验',
  },
  {
    id: 'sha1',
    name: 'SHA-1',
    fn: (msg, key) => {
      if (isHmacMode.value && key) return CryptoJS.HmacSHA1(msg, key).toString()
      return CryptoJS.SHA1(msg).toString()
    },
    description: '160位，已不建议用于安全场景',
  },
  {
    id: 'sha256',
    name: 'SHA-256',
    fn: (msg, key) => {
      if (isHmacMode.value && key) return CryptoJS.HmacSHA256(msg, key).toString()
      return CryptoJS.SHA256(msg).toString()
    },
    description: '256位，广泛用于安全场景',
  },
  {
    id: 'sha512',
    name: 'SHA-512',
    fn: (msg, key) => {
      if (isHmacMode.value && key) return CryptoJS.HmacSHA512(msg, key).toString()
      return CryptoJS.SHA512(msg).toString()
    },
    description: '512位，最高安全级别',
  },
  {
    id: 'sha224',
    name: 'SHA-224',
    fn: (msg, key) => {
      if (isHmacMode.value && key) return CryptoJS.HmacSHA224(msg, key).toString()
      return CryptoJS.SHA224(msg).toString()
    },
    description: '224位，SHA-256的截断版',
  },
  {
    id: 'sha384',
    name: 'SHA-384',
    fn: (msg, key) => {
      if (isHmacMode.value && key) return CryptoJS.HmacSHA384(msg, key).toString()
      return CryptoJS.SHA384(msg).toString()
    },
    description: '384位，SHA-512的截断版',
  },
  {
    id: 'sha3-256',
    name: 'SHA3-256',
    fn: (msg, key) => {
      if (isHmacMode.value && key) return CryptoJS.HmacSHA3(msg, key).toString()
      return CryptoJS.SHA3(msg, { outputLength: 256 }).toString()
    },
    description: '256位，新一代安全哈希',
  },
  {
    id: 'sha3-512',
    name: 'SHA3-512',
    fn: (msg, key) => {
      if (isHmacMode.value && key) return CryptoJS.HmacSHA3(msg, key).toString()
      return CryptoJS.SHA3(msg, { outputLength: 512 }).toString()
    },
    description: '512位，新一代安全哈希',
  },
  {
    id: 'ripemd160',
    name: 'RIPEMD-160',
    fn: (msg, key) => {
      if (isHmacMode.value && key) return CryptoJS.HmacRIPEMD160(msg, key).toString()
      return CryptoJS.RIPEMD160(msg).toString()
    },
    description: '160位，欧洲设计的哈希算法',
  },
]

// ===== 计算结果 =====
interface HashResult {
  algo: HashAlgo
  hash: string
  upperHash: string
  length: number
}

const results = computed<HashResult[]>(() => {
  if (!inputText.value) return []

  return algorithms.map(algo => {
    const hash = algo.fn(inputText.value, hmacKey.value)
    return {
      algo,
      hash: isUppercase.value ? hash.toUpperCase() : hash.toLowerCase(),
      upperHash: hash.toUpperCase(),
      length: hash.length,
    }
  })
})

// ===== 复制全部 =====
function copyAll(): string {
  return results.value
    .map(r => `${r.algo.name}: ${r.hash}`)
    .join('\n')
}

// ===== 实时计算标志 =====
const realtime = ref(true)

// ===== 文件哈希 =====
const fileInput = ref<HTMLInputElement | null>(null)
const fileResults = ref<{ name: string; hashes: Record<string, string> }[]>([])
const isFileProcessing = ref(false)

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  isFileProcessing.value = true
  fileResults.value = []

  for (const file of Array.from(files)) {
    const buffer = await file.arrayBuffer()
    const wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(buffer))

    const hashes: Record<string, string> = {}
    hashes['MD5'] = CryptoJS.MD5(wordArray).toString()
    hashes['SHA-1'] = CryptoJS.SHA1(wordArray).toString()
    hashes['SHA-256'] = CryptoJS.SHA256(wordArray).toString()
    hashes['SHA-512'] = CryptoJS.SHA512(wordArray).toString()

    fileResults.value.push({ name: file.name, hashes })
  }

  isFileProcessing.value = false
}

function clearFileResults() {
  fileResults.value = []
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <ToolCard title="哈希计算器" description="实时计算文本或文件的哈希值，支持MD5、SHA-1、SHA-256、SHA-512等多种算法">

    <div class="space-y-8">

      <!-- ===== 输入区 ===== -->
      <section>
        <div class="flex items-center justify-between mb-2">
          <label class="label-text">输入文本</label>
          <div class="flex items-center gap-2">
            <span class="text-xs text-content-tertiary">实时计算</span>
            <button
              @click="realtime = !realtime"
              :class="[
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer',
                realtime ? 'bg-[var(--accent)]' : 'bg-surface-tertiary'
              ]"
            >
              <span
                :class="[
                  'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm',
                  realtime ? 'translate-x-4.5' : 'translate-x-0.5'
                ]"
              />
            </button>
          </div>
        </div>
        <textarea
          v-model="inputText"
          class="textarea-field font-mono"
          rows="4"
          placeholder="输入要计算哈希的文本..."
        />
      </section>

      <!-- ===== 选项 ===== -->
      <section>
        <div class="flex flex-wrap items-center gap-4">
          <!-- 大小写切换 -->
          <div class="flex items-center gap-2">
            <label class="text-xs text-content-secondary">输出格式：</label>
            <button
              @click="isUppercase = false"
              :class="[
                'btn-sm flex items-center gap-1 transition-colors',
                !isUppercase ? 'bg-[var(--accent)] text-white' : 'bg-surface-secondary text-content-secondary border border-line'
              ]"
            >
              <CaseSensitive class="h-3.5 w-3.5" />
              小写
            </button>
            <button
              @click="isUppercase = true"
              :class="[
                'btn-sm flex items-center gap-1 transition-colors',
                isUppercase ? 'bg-[var(--accent)] text-white' : 'bg-surface-secondary text-content-secondary border border-line'
              ]"
            >
              <CaseUpper class="h-3.5 w-3.5" />
              大写
            </button>
          </div>

          <!-- HMAC 模式 -->
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="isHmacMode" class="accent-[var(--accent)] w-4 h-4" />
            <KeyRound class="h-3.5 w-3.5 text-content-secondary" />
            <span class="text-xs text-content-secondary">HMAC 模式</span>
          </label>
        </div>

        <!-- HMAC 密钥输入 -->
        <div v-if="isHmacMode" class="mt-3">
          <label class="label-text">HMAC 密钥</label>
          <input
            v-model="hmacKey"
            class="input-field font-mono"
            placeholder="输入 HMAC 密钥..."
          />
        </div>
      </section>

      <!-- ===== 哈希结果 ===== -->
      <section v-if="inputText">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-content-secondary flex items-center gap-1.5">
            <Hash class="h-4 w-4" />
            计算结果
          </h2>
          <CopyButton v-if="results.length > 0" :text="copyAll()" label="复制全部" size="sm" />
        </div>

        <div class="rounded-[12px] border border-line overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-line bg-surface-secondary">
                <th class="px-4 py-2.5 text-left text-xs font-semibold text-content-secondary w-28">算法</th>
                <th class="px-4 py-2.5 text-left text-xs font-semibold text-content-secondary">哈希值</th>
                <th class="px-4 py-2.5 text-right text-xs font-semibold text-content-secondary w-20">长度</th>
                <th class="px-4 py-2.5 w-16"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(r, idx) in results"
                :key="r.algo.id"
                :class="idx < results.length - 1 ? 'border-b border-line' : ''"
                class="hover:bg-surface-secondary/50 transition-colors"
              >
                <td class="px-4 py-2.5">
                  <div class="text-content-primary font-semibold">{{ r.algo.name }}</div>
                  <div class="text-xs text-content-tertiary">{{ r.algo.description }}</div>
                </td>
                <td class="px-4 py-2.5 font-mono text-xs text-content-primary break-all">
                  {{ r.hash }}
                </td>
                <td class="px-4 py-2.5 text-right text-xs text-content-tertiary font-mono">
                  {{ r.length }}
                </td>
                <td class="px-4 py-2.5 text-right">
                  <CopyButton :text="r.hash" label="" size="sm" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ===== 文件哈希 ===== -->
      <section>
        <h2 class="text-sm font-semibold text-content-secondary mb-3 flex items-center gap-1.5">
          <FileText class="h-4 w-4" />
          文件哈希计算
        </h2>

        <div class="flex items-center gap-3">
          <label class="btn-secondary cursor-pointer flex items-center gap-1.5">
            <FileText class="h-3.5 w-3.5" />
            选择文件
            <input
              ref="fileInput"
              type="file"
              multiple
              class="hidden"
              @change="handleFileChange"
            />
          </label>
          <button
            v-if="fileResults.length > 0"
            @click="clearFileResults"
            class="btn-secondary btn-sm"
          >
            清除
          </button>
          <span v-if="isFileProcessing" class="text-xs text-content-tertiary">计算中...</span>
        </div>

        <!-- 文件哈希结果 -->
        <div v-if="fileResults.length > 0" class="mt-4 space-y-3">
          <div
            v-for="file in fileResults"
            :key="file.name"
            class="rounded-[12px] border border-line overflow-hidden"
          >
            <div class="px-4 py-2.5 bg-surface-secondary border-b border-line">
              <span class="text-sm font-semibold text-content-primary">{{ file.name }}</span>
            </div>
            <table class="w-full text-sm">
              <tbody>
                <tr
                  v-for="(hash, algo) in file.hashes"
                  :key="algo"
                  class="border-b border-line last:border-b-0"
                >
                  <td class="px-4 py-2 text-content-tertiary w-24 text-xs font-semibold">{{ algo }}</td>
                  <td class="px-4 py-2 font-mono text-xs text-content-primary break-all">{{ hash }}</td>
                  <td class="px-4 py-2 w-16 text-right">
                    <CopyButton :text="hash" label="" size="sm" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ===== 使用说明 ===== -->
      <div class="rounded-[12px] bg-surface-secondary border border-line p-4">
        <h3 class="text-xs font-semibold text-content-secondary mb-2">使用说明</h3>
        <ul class="text-xs text-content-tertiary space-y-1">
          <li>• 所有计算在浏览器本地完成，数据不会上传到服务器</li>
          <li>• 支持 MD5、SHA-1、SHA-224、SHA-256、SHA-384、SHA-512、SHA3、RIPEMD-160 等算法</li>
          <li>• HMAC 模式使用密钥对消息进行签名，常用于 API 认证和数据完整性验证</li>
          <li>• 文件哈希支持同时计算多个文件，适合校验文件完整性</li>
          <li>• MD5 和 SHA-1 已不建议用于安全场景，推荐使用 SHA-256 或更高</li>
        </ul>
      </div>

    </div>
  </ToolCard>
</template>
