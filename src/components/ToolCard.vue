<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="space-y-6">
    <div class="tool-page">
      <div class="tool-header">
        <h1>{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
      </div>
      <div class="tool-body">
        <slot />
      </div>
    </div>
  </div>
</template>
