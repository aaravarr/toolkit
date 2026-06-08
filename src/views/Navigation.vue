<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Grip,
  X,
  Sun,
  Moon,
  Home,
  Ellipsis,
} from 'lucide-vue-next'
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { useDark } from '../composables/useDark'
import { implementedTools, toolCategories, type Tool, type ToolCategory } from '../config/tools'

const props = defineProps<{
  mode: 'rail' | 'mobile'
}>()

const router = useRouter()
const route = useRoute()
const { isDark, toggle: toggleDark } = useDark()

// Mobile drawer state
const drawerOpen = ref(false)

// Rail hover state
const railHovered = ref(false)
const labelFading = ref(false)

// 切换时短暂淡入淡出
watch(railHovered, () => {
  labelFading.value = true
  setTimeout(() => { labelFading.value = false }, 50)
})

const isCurrentRoute = (path: string) => route.path === path

// Tools grouped by category
const toolsByCategory = computed(() => {
  const map: Record<ToolCategory, Tool[]> = { text: [], data: [], dev: [] }
  implementedTools.forEach(tool => {
    if (tool.category) {
      map[tool.category].push(tool)
    }
  })
  return map
})

function navigate(path: string) {
  router.push(path)
  if (props.mode === 'mobile') {
    drawerOpen.value = false
  }
}
</script>

<template>
  <!-- ===== RAIL MODE (Desktop) ===== -->
  <div
    v-if="mode === 'rail'"
    class="fixed inset-y-0 left-0 z-50 hidden lg:flex flex-col border-r transition-all duration-200 ease-in-out overflow-hidden"
    :style="{
      width: railHovered ? 'var(--nav-width-expanded)' : 'var(--nav-width)',
      backgroundColor: 'var(--bg-primary)',
      borderColor: 'var(--border)',
      boxShadow: railHovered ? 'var(--shadow-elevated)' : 'none',
    }"
    @mouseenter="railHovered = true"
    @mouseleave="railHovered = false"
  >
    <!-- Logo -->
    <div class="flex items-center shrink-0 h-14 px-4">
      <img src="/favicon.svg" alt="Logo" class="h-7 w-7 shrink-0" />
      <span
        class="text-sm font-semibold whitespace-nowrap transition-all duration-200 overflow-hidden"
        :class="railHovered ? 'opacity-100 delay-100 ml-3 w-auto' : 'opacity-0 ml-0 w-0'"
        style="color: var(--text-primary)"
      >
        X-Utils
      </span>
    </div>

    <!-- Tool list -->
    <nav class="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2">
      <!-- Home -->
      <button
        type="button"
        @click="navigate('/')"
        class="flex items-center w-full rounded-[10px] mb-1 transition-colors duration-150"
        :class="[
          isCurrentRoute('/')
            ? 'text-accent bg-accent-soft'
            : 'hover:bg-surface-tertiary',
        ]"
        :style="{
          justifyContent: railHovered ? 'flex-start' : 'center',
          padding: railHovered ? '8px 12px' : '8px',
          color: isCurrentRoute('/') ? 'var(--accent)' : 'var(--text-tertiary)',
        }"
        :title="!railHovered ? '首页' : undefined"
      >
        <Home class="h-[18px] w-[18px] shrink-0" />
        <span
          class="text-[13px] whitespace-nowrap transition-all duration-200 overflow-hidden"
          :class="[
            railHovered ? 'opacity-100 delay-100 ml-3 w-auto' : 'opacity-0 ml-0 w-0',
            isCurrentRoute('/') ? 'font-medium' : 'font-normal',
          ]"
        >
          首页
        </span>
      </button>

      <!-- Categories -->
      <template v-for="category in toolCategories" :key="category.key">
        <!-- Category header — 收起时仅留小间距，展开时显示文字+正常间距 -->
        <div
          class="text-[11px] font-semibold uppercase tracking-wider h-9 flex items-center overflow-hidden opacity-75"
          :class="railHovered ? 'px-3 pb-1 items-end' : 'justify-center'"
          style="color: var(--text-tertiary)"
        >
          <span class="whitespace-nowrap transition-opacity duration-150" :class="labelFading ? 'opacity-0' : 'opacity-100'">
            {{ railHovered ? category.label : category.shortLabel }}
          </span>
        </div>

        <!-- Tool buttons -->
        <button
          v-for="item in toolsByCategory[category.key]"
          :key="item.name"
          type="button"
          @click="navigate(item.path)"
          class="flex items-center w-full rounded-[10px] mb-0.5 transition-colors duration-150"
          :class="[
            isCurrentRoute(item.path)
              ? 'text-accent bg-accent-soft'
              : 'hover:bg-surface-tertiary',
          ]"
          :style="{
            justifyContent: railHovered ? 'flex-start' : 'center',
            padding: railHovered ? '8px 12px' : '8px',
            color: isCurrentRoute(item.path) ? 'var(--accent)' : 'var(--text-tertiary)',
          }"
          :title="!railHovered ? item.name : undefined"
        >
          <component :is="item.icon" class="h-[18px] w-[18px] shrink-0" />
          <span
            class="text-[13px] whitespace-nowrap transition-all duration-200 overflow-hidden"
            :class="[
              railHovered ? 'opacity-100 delay-100 ml-3 w-auto' : 'opacity-0 ml-0 w-0',
              isCurrentRoute(item.path) ? 'font-medium' : 'font-normal',
            ]"
          >
            {{ item.name }}
          </span>
        </button>
      </template>

      <!-- More tools -->
      <button
        type="button"
        @click="navigate('/more')"
        class="flex items-center w-full rounded-[10px] mt-2 mb-1 transition-colors duration-150"
        :class="[
          isCurrentRoute('/more')
            ? 'text-accent bg-accent-soft'
            : 'hover:bg-surface-tertiary',
        ]"
        :style="{
          justifyContent: railHovered ? 'flex-start' : 'center',
          padding: railHovered ? '8px 12px' : '8px',
          color: isCurrentRoute('/more') ? 'var(--accent)' : 'var(--text-tertiary)',
        }"
        :title="!railHovered ? '更多工具' : undefined"
      >
        <Ellipsis class="h-[18px] w-[18px] shrink-0" />
        <span
          class="text-[13px] whitespace-nowrap transition-all duration-200 overflow-hidden"
          :class="[
            railHovered ? 'opacity-100 delay-100 ml-3 w-auto' : 'opacity-0 ml-0 w-0',
            isCurrentRoute('/more') ? 'font-medium' : 'font-normal',
          ]"
        >
          更多工具
        </span>
      </button>
    </nav>

    <!-- Dark mode toggle (bottom) -->
    <div class="shrink-0 px-2 py-3 border-t" style="border-color: var(--border)">
      <button
        type="button"
        @click="toggleDark"
        class="flex items-center w-full rounded-[10px] transition-colors duration-150 hover:bg-surface-tertiary"
        :style="{
          justifyContent: railHovered ? 'flex-start' : 'center',
          padding: railHovered ? '8px 12px' : '8px',
          color: 'var(--text-tertiary)',
        }"
        :title="!railHovered ? (isDark ? '浅色模式' : '深色模式') : undefined"
      >
        <Sun v-if="isDark" class="h-[18px] w-[18px] shrink-0" />
        <Moon v-else class="h-[18px] w-[18px] shrink-0" />
        <span
          class="text-sm font-medium whitespace-nowrap transition-all duration-200 overflow-hidden"
          :class="railHovered ? 'opacity-100 delay-100 ml-3 w-auto' : 'opacity-0 ml-0 w-0'"
        >
          {{ isDark ? '浅色模式' : '深色模式' }}
        </span>
      </button>
    </div>
  </div>

  <!-- ===== MOBILE MODE ===== -->
  <template v-if="mode === 'mobile'">
    <!-- Top bar -->
    <div
      class="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-4 border-b lg:hidden"
      style="height: var(--topbar-height); background-color: var(--bg-primary); border-color: var(--border)"
    >
      <!-- Hamburger -->
      <button
        type="button"
        class="p-2 -ml-2 rounded-lg transition-colors"
        style="color: var(--text-secondary)"
        @click="drawerOpen = true"
      >
        <span class="sr-only">打开导航</span>
        <Grip class="h-5 w-5" />
      </button>

      <!-- Logo + Title -->
      <div class="flex items-center absolute left-1/2 -translate-x-1/2 cursor-pointer" @click="navigate('/')">
        <img src="/favicon.svg" alt="Logo" class="h-6 w-6" />
        <span class="ml-2 text-sm font-semibold" style="color: var(--text-primary)">X-Utils</span>
      </div>

      <!-- Dark mode toggle -->
      <button
        type="button"
        class="p-2 -mr-2 rounded-lg transition-colors"
        style="color: var(--text-secondary)"
        @click="toggleDark"
      >
        <Sun v-if="isDark" class="h-5 w-5" />
        <Moon v-else class="h-5 w-5" />
      </button>
    </div>

    <!-- Drawer -->
    <TransitionRoot as="template" :show="drawerOpen">
      <Dialog as="div" class="relative z-50" @close="drawerOpen = false">
        <!-- Backdrop -->
        <TransitionChild
          as="template"
          enter="transition-opacity ease-linear duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0" style="background: rgba(0,0,0,0.5)" />
        </TransitionChild>

        <!-- Drawer panel -->
        <div class="fixed inset-0 flex">
          <TransitionChild
            as="template"
            enter="transition ease-in-out duration-300 transform"
            enter-from="-translate-x-full"
            enter-to="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leave-from="translate-x-0"
            leave-to="-translate-x-full"
          >
            <DialogPanel
              class="relative flex flex-col w-72 max-w-[80vw] h-full overflow-hidden"
              style="background-color: var(--bg-primary)"
            >
              <!-- Drawer header -->
              <div class="flex items-center justify-between px-5 h-14 shrink-0 border-b" style="border-color: var(--border)">
                <div class="flex items-center">
                  <img src="/favicon.svg" alt="Logo" class="h-6 w-6" />
                  <span class="ml-2 text-sm font-semibold" style="color: var(--text-primary)">X-Utils</span>
                </div>
                <button
                  type="button"
                  class="p-1.5 rounded-lg transition-colors"
                  style="color: var(--text-tertiary)"
                  @click="drawerOpen = false"
                >
                  <X class="h-5 w-5" />
                </button>
              </div>

              <!-- Drawer content -->
              <nav class="flex-1 overflow-y-auto py-3 px-3">
                <!-- Home -->
                <button
                  type="button"
                  @click="navigate('/')"
                  class="flex items-center w-full gap-3 rounded-[10px] px-3 py-2 mb-1 text-[13px] transition-colors"
                  :class="[
                    isCurrentRoute('/')
                      ? 'bg-accent-soft font-medium'
                      : 'hover:bg-surface-tertiary font-normal',
                  ]"
                  :style="{ color: isCurrentRoute('/') ? 'var(--accent)' : 'var(--text-primary)' }"
                >
                  <Home class="h-5 w-5 shrink-0" style="color: inherit" />
                  首页
                </button>

                <!-- Categories -->
                <template v-for="category in toolCategories" :key="category.key">
                  <p
                    class="px-3 pt-5 pb-1 text-xs uppercase tracking-wider"
                    style="color: var(--text-tertiary)"
                  >
                    {{ category.label }}
                  </p>
                  <button
                    v-for="item in toolsByCategory[category.key]"
                    :key="item.name"
                    type="button"
                    @click="navigate(item.path)"
                    class="flex items-center w-full gap-3 rounded-[10px] px-3 py-2 mb-0.5 text-[13px] transition-colors"
                    :class="[
                      isCurrentRoute(item.path)
                        ? 'bg-accent-soft font-medium'
                        : 'hover:bg-surface-tertiary font-normal',
                    ]"
                    :style="{ color: isCurrentRoute(item.path) ? 'var(--accent)' : 'var(--text-primary)' }"
                  >
                    <component :is="item.icon" class="h-5 w-5 shrink-0" style="color: inherit" />
                    {{ item.name }}
                  </button>
                </template>

                <!-- More tools -->
                <button
                  type="button"
                  @click="navigate('/more')"
                  class="flex items-center w-full gap-3 rounded-[10px] px-3 py-2 mt-3 mb-1 text-[13px] transition-colors"
                  :class="[
                    isCurrentRoute('/more')
                      ? 'bg-accent-soft font-medium'
                      : 'hover:bg-surface-tertiary font-normal',
                  ]"
                  :style="{ color: isCurrentRoute('/more') ? 'var(--accent)' : 'var(--text-primary)' }"
                >
                  <Ellipsis class="h-5 w-5 shrink-0" style="color: inherit" />
                  更多工具
                </button>
              </nav>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>
  </template>
</template>
