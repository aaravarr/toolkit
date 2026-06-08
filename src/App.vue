<script setup lang="ts">
import Navigation from './views/Navigation.vue'
</script>

<template>
  <!-- Desktop: icon rail + content -->
  <div class="hidden lg:flex min-h-screen bg-surface-secondary">
    <Navigation mode="rail" />
    <main class="flex-1 ml-16">
      <div class="p-6 lg:p-8">
        <router-view />
      </div>
    </main>
  </div>

  <!-- Mobile: top bar + content -->
  <div class="lg:hidden min-h-screen bg-surface-secondary">
    <Navigation mode="mobile" />
    <main class="pt-14">
      <div class="p-4">
        <router-view />
      </div>
    </main>
  </div>
</template>
