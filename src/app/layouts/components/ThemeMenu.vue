<script setup lang="ts">
  import { Monitor, Moon, Settings, Sun } from '@lucide/vue'
  import { onBeforeUnmount, onMounted, ref } from 'vue'
  import { useTheme, type ThemeMode } from '@/shared/composables/useTheme'
  import { THEME_PALETTES, type ThemePalette } from '@/shared/theme/palettes'
  import { Button } from '@/shared/ui/components/button'

  const { mode, setMode, palette, setPalette } = useTheme()

  const open = ref(false)
  const root = ref<HTMLElement | null>(null)

  const modes: Array<{ value: ThemeMode; label: string; icon: typeof Sun }> = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Oscuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ]

  function selectPalette(p: ThemePalette) {
    setPalette(p)
  }

  function selectMode(m: ThemeMode) {
    setMode(m)
  }

  function onDocumentClick(e: MouseEvent) {
    if (!root.value?.contains(e.target as Node)) open.value = false
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') open.value = false
  }

  onMounted(() => {
    document.addEventListener('click', onDocumentClick)
    document.addEventListener('keydown', onKeydown)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('click', onDocumentClick)
    document.removeEventListener('keydown', onKeydown)
  })
</script>

<template>
  <div ref="root" class="relative">
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Apariencia"
      :aria-expanded="open"
      @click.stop="open = !open"
    >
      <Settings :size="18" />
    </Button>

    <div
      v-if="open"
      class="absolute right-0 top-full z-50 mt-2 w-64 rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-md"
    >
      <p class="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Tema</p>
      <div class="flex flex-wrap gap-2 px-2 pb-2">
        <button
          v-for="p in THEME_PALETTES"
          :key="p.value"
          type="button"
          class="grid size-9 grid-cols-2 grid-rows-2 overflow-hidden rounded-md border border-border transition-transform hover:scale-105"
          :class="{ 'ring-2 ring-ring ring-offset-1 ring-offset-background': palette === p.value }"
          :aria-label="p.label"
          :title="p.label"
          :aria-pressed="palette === p.value"
          @click.stop="selectPalette(p.value)"
        >
          <span
            v-for="(color, i) in p.swatch"
            :key="i"
            class="h-full w-full"
            :style="{ backgroundColor: color }"
          />
        </button>
      </div>

      <div class="my-1 h-px bg-border" />

      <p class="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Modo</p>
      <div class="flex flex-col gap-1 px-1 py-1">
        <button
          v-for="m in modes"
          :key="m.value"
          type="button"
          class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
          :class="{ 'bg-accent text-accent-foreground': mode === m.value }"
          :aria-pressed="mode === m.value"
          @click.stop="selectMode(m.value)"
        >
          <component :is="m.icon" :size="16" class="shrink-0" />
          {{ m.label }}
        </button>
      </div>
    </div>
  </div>
</template>
