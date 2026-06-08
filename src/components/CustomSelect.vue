<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

export interface SelectOption {
  label: string
  value: any
  icon?: any
}

const props = defineProps<{
  modelValue: any
  options: SelectOption[]
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue)
})

function selectOption(option: SelectOption) {
  emit('update:modelValue', option.value)
  isOpen.value = false
}

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="dropdownRef" class="custom-select">
    <button
      type="button"
      class="select-trigger"
      :class="{ active: isOpen }"
      @click="toggleDropdown"
    >
      <span class="select-value">
        <component v-if="selectedOption?.icon" :is="selectedOption.icon" class="w-3 h-3" />
        <span>{{ selectedOption?.label || placeholder || '请选择' }}</span>
      </span>
      <ChevronDown
        class="w-3 h-3 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="dropdown-menu"
      >
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          class="dropdown-item"
          :class="{ selected: option.value === modelValue }"
          @click="selectOption(option)"
        >
          <component v-if="option.icon" :is="option.icon" class="w-3 h-3" />
          <span>{{ option.label }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.custom-select {
  position: relative;
  display: inline-block;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  min-width: 5rem;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.25rem;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
  height: 2rem;
}

.select-trigger:hover {
  border-color: var(--border-hover);
}

.select-trigger.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-soft);
}

.select-value {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  padding: 0.25rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 50;
  min-width: 100%;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  color: var(--text-primary);
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.dropdown-item:hover {
  background: var(--bg-secondary);
}

.dropdown-item.selected {
  background: var(--accent-soft);
  color: var(--accent);
}

/* 动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
