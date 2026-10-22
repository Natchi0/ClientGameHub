<script setup lang="ts">
  import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <AppHeader />
    <main class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <slot />
    </main>
  </div>
</template>
