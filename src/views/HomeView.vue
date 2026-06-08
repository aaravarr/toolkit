<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { MagnifyingGlassIcon } from '@heroicons/vue/20/solid'
import { implementedTools, toolCategories, type Tool, type ToolCategory } from '../config/tools'

const router = useRouter()
const searchQuery = ref('')

const toolsByCategory = computed(() => {
  const map: Record<ToolCategory, Tool[]> = { text: [], data: [], dev: [] }
  implementedTools.forEach(tool => {
    if (tool.category) {
      map[tool.category].push(tool)
    }
  })
  return map
})

const filteredTools = computed(() => {
  if (!searchQuery.value.trim()) return null
  const q = searchQuery.value.toLowerCase()
  return implementedTools.filter(tool =>
    tool.name.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q)
  )
})

const getGlobalIndex = (tool: Tool) => implementedTools.findIndex(t => t.path === tool.path)

function clearSearch() {
  searchQuery.value = ''
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
    <!-- Hero -->
    <div class="text-center">
      <h1 class="text-3xl font-bold tracking-tight text-content-primary md:text-4xl">
        实用工具，高效工作
      </h1>
      <p class="mt-3 text-base text-content-secondary md:text-lg">
        一系列精心打造的在线工具，助您轻松完成日常任务
      </p>
    </div>

    <!-- Search -->
    <div class="mx-auto mt-8 max-w-md">
      <div class="relative">
        <MagnifyingGlassIcon
          class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-content-tertiary"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索工具..."
          class="w-full rounded-xl border-[1.5px] border-line bg-surface-primary py-3 pl-10 pr-4 text-sm text-content-primary placeholder:text-content-tertiary focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-soft transition-colors"
        />
      </div>
    </div>

    <!-- Tool grid -->
    <div class="mt-12 space-y-10">
      <!-- Searching: flat filtered list -->
      <template v-if="filteredTools !== null">
        <div
          v-if="filteredTools.length > 0"
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div
            v-for="tool in filteredTools"
            :key="tool.path"
            class="animate-slide-up group flex cursor-pointer items-start gap-4 rounded-2xl border border-line bg-surface-primary p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-lg"
            :style="{ animationDelay: `${getGlobalIndex(tool) * 50}ms`, animationFillMode: 'both' }"
            @click="router.push(tool.path)"
          >
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-accent-soft">
              <component :is="tool.icon" class="h-6 w-6 text-accent" />
            </div>
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-content-primary">
                {{ tool.name }}
              </h3>
              <p class="mt-1 text-xs leading-relaxed text-content-secondary">
                {{ tool.description }}
              </p>
            </div>
          </div>
        </div>

        <!-- No results -->
        <div v-else class="py-16 text-center">
          <p class="text-content-tertiary">未找到匹配的工具</p>
          <button
            class="mt-3 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
            @click="clearSearch"
          >
            清空搜索
          </button>
        </div>
      </template>

      <!-- Not searching: show by category -->
      <template v-else>
        <section v-for="category in toolCategories" :key="category.key">
          <h2 class="mb-4 text-xs font-semibold uppercase tracking-wider text-content-tertiary">
            {{ category.label }}
          </h2>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="tool in toolsByCategory[category.key]"
              :key="tool.path"
              class="animate-slide-up group flex cursor-pointer items-start gap-4 rounded-2xl border border-line bg-surface-primary p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-lg"
              :style="{ animationDelay: `${getGlobalIndex(tool) * 50}ms`, animationFillMode: 'both' }"
              @click="router.push(tool.path)"
            >
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-accent-soft">
                <component :is="tool.icon" class="h-6 w-6 text-accent" />
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-semibold text-content-primary">
                  {{ tool.name }}
                </h3>
                <p class="mt-1 text-xs leading-relaxed text-content-secondary">
                  {{ tool.description }}
                </p>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>
