<script setup lang="ts">
  import type { Component } from 'vue'
  import { RouterLink } from 'vue-router'
  import { Button } from '@/shared/ui/components/button'

  interface Props {
    to: string
    icon: Component
    label: string
  }

  const props = defineProps<Props>()
</script>

<template>
  <!--
    Botón con la acción oculta: sólo se ve el ícono y la etiqueta aparece al pasar el mouse.
    El padding horizontal crece en el hover y la animación es lenta a propósito.
  -->
  <Button
    as-child
    variant="ghost"
    class="group/hover-label overflow-hidden px-2.5 has-[>svg]:px-2.5 transition-[padding] duration-500 ease-out hover:px-4 hover:has-[>svg]:px-4"
  >
    <RouterLink
      :to="props.to"
      class="flex items-center whitespace-nowrap"
      :aria-label="props.label"
      :title="props.label"
    >
      <component :is="props.icon" :size="18" class="shrink-0" />
      <span
        class="ml-0 max-w-0 overflow-hidden opacity-0 transition-[max-width,margin,opacity] duration-500 ease-out group-hover/hover-label:ml-2 group-hover/hover-label:max-w-40 group-hover/hover-label:opacity-100 group-focus-visible/hover-label:ml-2 group-focus-visible/hover-label:max-w-40 group-focus-visible/hover-label:opacity-100"
        >{{ props.label }}</span
      >
    </RouterLink>
  </Button>
</template>
