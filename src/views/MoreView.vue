<script setup lang="ts">
import { developingTools } from '../config/tools'
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
    <!-- Hero -->
    <div class="text-center">
      <h1 class="text-3xl font-bold tracking-tight text-content-primary md:text-4xl">
        更多工具
      </h1>
      <p class="mt-3 text-base text-content-secondary md:text-lg">
        我们正在开发更多实用的工具，敬请期待
      </p>
    </div>

    <!-- Tool grid -->
    <div class="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="(tool, index) in developingTools"
        :key="tool.path"
        class="animate-slide-up flex items-start gap-4 rounded-2xl border border-line bg-surface-tertiary p-5"
        :style="{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }"
      >
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-surface-primary">
          <component :is="tool.icon" class="h-6 w-6 text-content-tertiary" />
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-sm font-semibold text-content-primary">
            {{ tool.name }}
          </h3>
          <p class="mt-1 text-xs leading-relaxed text-content-secondary">
            {{ tool.description }}
          </p>
          <div class="mt-3">
            <span class="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {{ tool.status }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
