<script setup lang="ts">
  import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background text-foreground">
    <AppHeader compact />
    <main class="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-8 sm:px-6">
      <div class="w-full">
        <slot />
      </div>
    </main>
  </div>
</template>
