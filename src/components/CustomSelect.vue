<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  options: SelectOption[]
  modelValue: string | number
  placeholder?: string
  disabled?: boolean
}>(), {
  placeholder: '请选择',
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const isOpen = ref(false)
const selectRef = ref<HTMLDivElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})

const selectedLabel = computed(() => {
  const found = props.options.find(o => o.value === props.modelValue)
  return found ? found.label : props.placeholder
})

function updateDropdownPosition() {
  if (!selectRef.value) return
  const rect = selectRef.value.getBoundingClientRect()
  dropdownStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    minWidth: `${rect.width}px`,
    zIndex: '9999',
  }
}

function toggle() {
  if (props.disabled) return
  if (!isOpen.value) {
    updateDropdownPosition()
  }
  isOpen.value = !isOpen.value
}

function select(option: SelectOption) {
  if (option.disabled) return
  emit('update:modelValue', option.value)
  isOpen.value = false
}

function handleClickOutside(e: MouseEvent) {
  if (selectRef.value && !selectRef.value.contains(e.target as Node)) {
    // Also check if click is on the teleported dropdown
    const dropdown = document.querySelector('.custom-select__dropdown--portal')
    if (dropdown && dropdown.contains(e.target as Node)) return
    isOpen.value = false
  }
}

function handleScroll() {
  if (isOpen.value) {
    updateDropdownPosition()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleScroll, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleScroll, true)
})
</script>

<template>
  <div ref="selectRef" class="custom-select" :class="{ 'custom-select--disabled': disabled }">
    <button
      type="button"
      class="custom-select__trigger"
      :class="{ 'custom-select__trigger--open': isOpen }"
      @click="toggle"
    >
      <span class="custom-select__value">{{ selectedLabel }}</span>
      <ChevronDown
        class="custom-select__arrow"
        :class="{ 'custom-select__arrow--open': isOpen }"
      />
    </button>
    <Teleport to="body">
      <Transition name="dropdown">
        <div v-if="isOpen" class="custom-select__dropdown custom-select__dropdown--portal" :style="dropdownStyle">
          <div
            v-for="option in options"
            :key="option.value"
            class="custom-select__option"
            :class="{
              'custom-select__option--active': option.value === modelValue,
              'custom-select__option--disabled': option.disabled,
            }"
            @click="select(option)"
          >
            {{ option.label }}
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.custom-select {
  position: relative;
  display: inline-block;
  min-width: 0;
}

.custom-select--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.custom-select__trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 5px 28px 5px 10px;
  border-radius: 8px;
  border: 1.5px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.8125rem;
  line-height: 1.5;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  text-align: left;
  white-space: nowrap;
  position: relative;
}

.custom-select__trigger:hover {
  border-color: var(--border-hover);
}

.custom-select__trigger--open,
.custom-select__trigger:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.custom-select__value {
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.custom-select__arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: var(--text-tertiary);
  transition: transform 0.2s ease;
  pointer-events: none;
}

.custom-select__arrow--open {
  transform: translateY(-50%) rotate(180deg);
}
</style>

<style>
/* Portal dropdown styles - not scoped so they apply to teleported element */
.custom-select__dropdown--portal {
  max-height: 240px;
  overflow-y: auto;
  border-radius: 10px;
  border: 1.5px solid var(--border);
  background: var(--bg-primary);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
  padding: 4px;
}

.dark .custom-select__dropdown--portal {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3);
}

.custom-select__dropdown--portal .custom-select__option {
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.8125rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: background-color 0.1s ease;
  white-space: nowrap;
}

.custom-select__dropdown--portal .custom-select__option:hover {
  background: var(--bg-tertiary);
}

.custom-select__dropdown--portal .custom-select__option--active {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 500;
}

.custom-select__dropdown--portal .custom-select__option--active:hover {
  background: var(--accent-soft);
}

.custom-select__dropdown--portal .custom-select__option--disabled {
  opacity: 0.4;
  pointer-events: none;
}

/* Dropdown animation */
.dropdown-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
