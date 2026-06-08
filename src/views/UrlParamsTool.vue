<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { parseUrl, stringifyQuery } from '../utils/url'
import { useRoute, useRouter } from 'vue-router'
import ToolCard from '../components/ToolCard.vue'
import CopyButton from '../components/CopyButton.vue'

const route = useRoute()
const router = useRouter()

const input = ref('')
const autoEncode = ref(true)

const parsed = computed(() => parseUrl(input.value))
const queryPairs = computed(() => Object.entries(parsed.value.query))
const queryString = computed(() => stringifyQuery(parsed.value.query, { encode: autoEncode.value, addPrefix: true }))

function toBase64Url(text: string): string {
  try {
    const b64 = btoa(unescape(encodeURIComponent(text)))
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  } catch {
    return ''
  }
}

function fromBase64Url(text: string): string {
  try {
    const pad = text.length % 4 === 2 ? '==' : text.length % 4 === 3 ? '=' : ''
    const b64 = text.replace(/-/g, '+').replace(/_/g, '/') + pad
    return decodeURIComponent(escape(atob(b64)))
  } catch {
    return ''
  }
}

// 初始化从路由解码
onMounted(() => {
  const data = route.params.data as string | undefined
  if (data) {
    const decoded = fromBase64Url(data)
    if (decoded) input.value = decoded
  }
})

// 输入变化 -> 更新路由
watch(input, (val) => {
  const payload = val ? toBase64Url(val) : undefined
  router.replace({ name: 'url-params', params: { data: payload } })
})
</script>

<template>
  <div class="space-y-6">
    <!-- 输入卡片 -->
    <ToolCard title="URL 参数解析" description="支持输入完整 URL 或仅查询串（例如：?a=1&b=2）。">
      <div class="space-y-4">
        <div>
          <label class="label-text">输入 URL 或查询串</label>
          <textarea
            v-model="input"
            rows="6"
            class="textarea-field"
            placeholder="https://example.com/path?foo=bar&foo=baz&empty=&q=hello+world#section"
          ></textarea>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label class="inline-flex items-center gap-2 text-sm text-content-secondary cursor-pointer">
            <input type="checkbox" v-model="autoEncode" class="h-4 w-4 rounded border-line text-accent focus:ring-accent cursor-pointer" />
            输出时进行 URL 编码
          </label>
          <div class="flex gap-2">
            <button type="button" class="btn-secondary !px-2 !py-1 !text-xs cursor-pointer" @click="input = ''">清空</button>
            <CopyButton :text="input" label="复制输入" size="sm" />
          </div>
        </div>
      </div>
    </ToolCard>

    <!-- 结果卡片 -->
    <ToolCard title="解析结果">
      <div class="flex items-center justify-between mb-4">
        <div></div>
        <div class="flex gap-2">
          <CopyButton :text="queryString" label="复制查询串" size="sm" />
          <CopyButton :text="JSON.stringify(parsed, null, 2)" label="复制 JSON" size="sm" />
        </div>
      </div>

      <div class="space-y-6">
        <div>
          <label class="label-text">参数列表</label>
          <div class="rounded-md border border-line">
            <div class="grid grid-cols-3 gap-2 border-b border-line bg-surface-secondary p-2 text-xs font-medium text-content-secondary">
              <div>Key</div>
              <div class="col-span-2">Value</div>
            </div>
            <div class="divide-y divide-line">
              <div v-if="queryPairs.length === 0" class="p-3 text-sm text-content-secondary">暂无参数</div>
              <div v-for="([k, v], idx) in queryPairs" :key="k + '_' + idx" class="grid grid-cols-3 gap-2 p-2 text-sm">
                <div class="truncate font-mono text-content-primary" :title="k">{{ k }}</div>
                <div class="col-span-2 font-mono text-content-secondary break-all" :title="Array.isArray(v) ? v.join(', ') : (v as string)">
                  <template v-if="Array.isArray(v)">
                    [<span>{{ (v as string[]).join(', ') }}</span>]
                  </template>
                  <template v-else>
                    {{ v as string }}
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label class="label-text">路径</label>
          <div class="rounded-md py-2 px-3 text-content-primary ring-1 ring-inset ring-line bg-surface-primary font-mono text-sm break-all">
            {{ parsed.path || '/' }}
          </div>
        </div>

        <div>
          <label class="label-text">查询串</label>
          <div class="rounded-md py-2 px-3 text-content-primary ring-1 ring-inset ring-line bg-surface-primary font-mono text-sm break-all min-h-field">
            {{ queryString }}
          </div>
        </div>

        <div>
          <label class="label-text">哈希</label>
          <div class="rounded-md py-2 px-3 text-content-primary ring-1 ring-inset ring-line bg-surface-primary font-mono text-sm break-all min-h-field">
            {{ parsed.hash || '' }}
          </div>
        </div>
      </div>
    </ToolCard>
  </div>
</template>
