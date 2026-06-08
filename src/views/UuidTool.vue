<script setup lang="ts">
import { ref, computed } from 'vue'
import ToolCard from '../components/ToolCard.vue'
import CopyButton from '../components/CopyButton.vue'
import { Fingerprint, RefreshCw, Copy, Settings2 } from 'lucide-vue-next'

// ===== 生成选项 =====
const count = ref(1)
const uppercase = ref(false)
const withHyphens = ref(true)

// ===== UUID 列表 =====
const uuids = ref<string[]>([])

// UUID v4 生成（使用 crypto.randomUUID，带 fallback）
function generateUUIDv4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback: 使用 crypto.getRandomValues
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 1
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32),
    ].join('-')
  }
  // 最终 fallback: Math.random（不推荐，但保证可用）
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// 格式化 UUID
function formatUUID(uuid: string): string {
  let result = uuid
  if (uppercase.value) result = result.toUpperCase()
  else result = result.toLowerCase()
  if (!withHyphens.value) result = result.replace(/-/g, '')
  return result
}

// 生成 UUID 列表
function generate() {
  const n = Math.max(1, Math.min(100, count.value))
  uuids.value = Array.from({ length: n }, () => formatUUID(generateUUIDv4()))
}

// 重新格式化已有列表
function reformat() {
  uuids.value = uuids.value.map(u => {
    // 先恢复原始格式（加回连字符），再重新格式化
    const raw = u.replace(/-/g, '')
    const withDash = [
      raw.slice(0, 8),
      raw.slice(8, 12),
      raw.slice(12, 16),
      raw.slice(16, 20),
      raw.slice(20, 32),
    ].join('-')
    return formatUUID(withDash)
  })
}

// 复制全部
const allText = computed(() => uuids.value.join('\n'))

// 初始化时生成一个
generate()
</script>

<template>
  <ToolCard title="UUID 生成器" description="在线生成 UUID v4（随机），支持批量生成、大小写切换、连字符控制">

    <div class="space-y-6">

      <!-- ===== 生成选项 ===== -->
      <section>
        <h2 class="text-sm font-semibold text-content-secondary mb-3 flex items-center gap-1.5">
          <Settings2 class="h-4 w-4" />
          生成选项
        </h2>

        <div class="rounded-[12px] border border-line p-4 bg-surface-secondary">
          <div class="flex flex-col sm:flex-row sm:items-end gap-4">
            <!-- 数量 -->
            <div class="flex-1 min-w-0">
              <label class="label-text">生成数量</label>
              <div class="flex items-center gap-2 mt-1">
                <input
                  v-model.number="count"
                  type="number"
                  min="1"
                  max="100"
                  class="input-field w-24 font-mono"
                />
                <span class="text-xs text-content-tertiary">1 ~ 100</span>
              </div>
            </div>

            <!-- 大小写 -->
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  v-model="uppercase"
                  class="rounded accent-[var(--accent)]"
                />
                <span class="text-sm text-content-secondary">大写</span>
              </label>
            </div>

            <!-- 连字符 -->
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  v-model="withHyphens"
                  class="rounded accent-[var(--accent)]"
                />
                <span class="text-sm text-content-secondary">含连字符</span>
              </label>
            </div>
          </div>

          <!-- 按钮 -->
          <div class="flex gap-2 mt-4">
            <button @click="generate" class="btn-primary flex items-center gap-1.5">
              <RefreshCw class="h-4 w-4" />
              生成
            </button>
            <button @click="reformat" class="btn-secondary flex items-center gap-1.5">
              <Copy class="h-4 w-4" />
              重新格式化
            </button>
          </div>
        </div>
      </section>

      <!-- ===== 结果列表 ===== -->
      <section v-if="uuids.length">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-content-secondary flex items-center gap-1.5">
            <Fingerprint class="h-4 w-4" />
            生成结果
            <span class="text-xs font-normal text-content-tertiary">({{ uuids.length }} 个)</span>
          </h2>
          <CopyButton v-if="uuids.length > 1" :text="allText" label="复制全部" size="sm" />
        </div>

        <div class="rounded-[12px] border border-line overflow-hidden divide-y divide-line">
          <div
            v-for="(uuid, index) in uuids"
            :key="index"
            class="flex items-center justify-between px-4 py-2.5 bg-surface-primary hover:bg-surface-secondary transition-colors"
          >
            <span class="font-mono text-sm text-content-primary break-all select-all">
              {{ uuid }}
            </span>
            <CopyButton :text="uuid" label="" size="sm" />
          </div>
        </div>
      </section>

      <!-- ===== 空状态 ===== -->
      <div v-else class="text-center py-12 text-content-tertiary">
        <Fingerprint class="h-10 w-10 mx-auto mb-2 opacity-40" />
        <p class="text-sm">点击"生成"按钮创建 UUID</p>
      </div>

    </div>
  </ToolCard>
</template>
