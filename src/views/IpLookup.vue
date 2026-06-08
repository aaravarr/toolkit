<template>
  <ToolCard title="IP地址查询" description="当前IP地址的详细信息">
    <div v-if="ipInfo" class="space-y-2">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="overflow-hidden rounded-lg bg-surface-primary px-4 py-5 shadow sm:p-6">
          <dt class="truncate text-sm font-medium text-content-secondary">IP地址</dt>
          <dd class="mt-1 text-3xl font-semibold tracking-tight text-content-primary font-mono">{{ ipInfo.ipAddress }}</dd>
        </div>
        <div class="overflow-hidden rounded-lg bg-surface-primary px-4 py-5 shadow sm:p-6">
          <dt class="truncate text-sm font-medium text-content-secondary">国家/地区</dt>
          <dd class="mt-1 text-3xl font-semibold tracking-tight text-content-primary">{{ ipInfo.countryName }}</dd>
        </div>
        <div class="overflow-hidden rounded-lg bg-surface-primary px-4 py-5 shadow sm:p-6">
          <dt class="truncate text-sm font-medium text-content-secondary">城市</dt>
          <dd class="mt-1 text-3xl font-semibold tracking-tight text-content-primary">{{ ipInfo.city }}</dd>
        </div>
        <div class="overflow-hidden rounded-lg bg-surface-primary px-4 py-5 shadow sm:p-6">
          <dt class="truncate text-sm font-medium text-content-secondary">州/省</dt>
          <dd class="mt-1 text-3xl font-semibold tracking-tight text-content-primary">{{ ipInfo.stateProv }}</dd>
        </div>
      </div>
    </div>
    <ErrorAlert v-else-if="error" :message="error" :retryable="true" @retry="getIpInfo" />
    <div v-else class="text-center py-4">
      <ArrowPathIcon class="mx-auto h-8 w-8 text-accent animate-spin" />
      <div class="mt-2 text-sm text-content-secondary">正在获取IP信息...</div>
    </div>
  </ToolCard>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import ToolCard from '../components/ToolCard.vue'
import ErrorAlert from '../components/ErrorAlert.vue'

const ipInfo = ref<any>(null)
const error = ref('')

// IP地址查询
const getIpInfo = async () => {
  error.value = ''
  ipInfo.value = null

  try {
    const response = await fetch('https://api.db-ip.com/v2/free/self', {
      cache: 'no-store'
    })
    if (!response.ok) {
      throw new Error('请求失败')
    }
    ipInfo.value = await response.json()
  } catch (err) {
    console.error('获取IP信息失败:', err)
    error.value = '获取IP信息失败，请检查网络连接后重试'
  }
}

// 页面加载时自动获取IP信息
onMounted(() => {
  getIpInfo()
})
</script>
