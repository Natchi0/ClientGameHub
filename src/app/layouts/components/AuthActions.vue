<script setup lang="ts">
  import { LogIn, UserPlus } from '@lucide/vue'
  import HoverLabelLink from '@/shared/ui/HoverLabelLink.vue'
</script>

<template>
  <!-- En mobile el acceso se muestra con etiqueta completa dentro del menú de navegación. -->
  <div class="hidden items-center gap-1 sm:flex">
    <HoverLabelLink to="/login" :icon="LogIn" label="Ingresar" />
    <HoverLabelLink to="/register" :icon="UserPlus" label="Crear cuenta" />
  </div>
</template>
