<script setup lang="ts">
  import { ArrowLeft, Gamepad2 } from '@lucide/vue'
  import { Button } from '@/shared/ui/components/button'
</script>

<template>
  <section
    class="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center"
  >
    <span class="grid size-14 place-items-center rounded-xl bg-surface text-primary"
      ><Gamepad2 :size="28"
    /></span>
    <p class="mt-8 font-heading text-sm font-bold tracking-[0.12em] text-primary">ERROR 404</p>
    <h1 class="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Esta página no existe</h1>
    <p class="mt-4 max-w-md leading-7 text-muted-foreground">
      Puede que el enlace esté incompleto o que esta partida ya haya terminado.
    </p>
    <Button as-child size="lg" class="mt-8"
      ><RouterLink to="/dashboard"
        ><ArrowLeft data-icon="inline-start" /> Volver al inicio</RouterLink
      ></Button
    >
  </section>
</template>
