<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

defineProps<{
  message: string
  retryable?: boolean
}>()

defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="rounded-[12px] bg-red-50 border border-red-200 p-4 dark:bg-red-900/20 dark:border-red-800">
    <div class="flex">
      <div class="flex-shrink-0">
        <AlertTriangle class="h-5 w-5 text-red-400 dark:text-red-500" aria-hidden="true" />
      </div>
      <div class="ml-3 flex-1">
        <p class="text-sm text-red-800 dark:text-red-300">{{ message }}</p>
      </div>
      <div v-if="retryable" class="ml-auto pl-3">
        <div class="-mx-1.5 -my-1.5">
          <button
            type="button"
            class="inline-flex rounded-[8px] bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50 cursor-pointer dark:bg-red-900/30 dark:hover:bg-red-900/50"
            aria-label="重试"
            @click="$emit('retry')"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.233a.75.75 0 00-.75.75v4a.75.75 0 001.5 0v-2.158l.311.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-11.24-3.06a5.5 5.5 0 019.201-2.466l.312.311h-2.433a.75.75 0 000 1.5h4a.75.75 0 00.75-.75v-4a.75.75 0 00-1.5 0v2.158l-.311-.31A7 7 0 002.622 8.71a.75.75 0 001.449.39z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
