<script setup lang="ts">
export interface SegmentedOption {
  label: string
  value: any
  icon?: any
}

defineProps<{
  modelValue: any
  options: SegmentedOption[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

function selectOption(value: any) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="segmented-control">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="segmented-item"
      :class="{ active: option.value === modelValue }"
      @click="selectOption(option.value)"
    >
      <component v-if="option.icon" :is="option.icon" class="w-3 h-3" />
      <span>{{ option.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.segmented-control {
  display: inline-flex;
  align-items: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 0.125rem;
  gap: 0.125rem;
  height: 2rem;
}

.segmented-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.segmented-item:hover {
  color: var(--text-primary);
  background: var(--bg-primary);
}

.segmented-item.active {
  color: var(--accent);
  background: var(--bg-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
