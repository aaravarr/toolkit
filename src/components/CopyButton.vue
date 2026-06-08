<script setup lang="ts">
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/vue/20/solid'
import { useClipboard } from '../composables/useClipboard'

withDefaults(defineProps<{
  text: string
  label?: string
  size?: 'sm' | 'md'
}>(), {
  label: '复制',
  size: 'md',
})

const { copy, copied } = useClipboard()
</script>

<template>
  <button
    type="button"
    :disabled="copied"
    :class="[
      'inline-flex items-center justify-center font-semibold transition-all duration-150 cursor-pointer',
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
      copied
        ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-300 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-700'
        : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]',
      size === 'sm' ? 'rounded-lg px-2.5 py-1.5 text-xs gap-1' : 'rounded-[10px] px-3.5 py-2.5 text-sm gap-1.5',
    ]"
    :aria-label="copied ? '已复制' : label"
    @click="copy(text)"
  >
    <CheckIcon v-if="copied" :class="size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'" />
    <ClipboardDocumentIcon v-else :class="size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'" />
    <span>{{ copied ? '已复制' : label }}</span>
  </button>
</template>
