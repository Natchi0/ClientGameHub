<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { resolveAvatarUrl } from '@/shared/lib/avatarUrl'

  interface Props {
    /** URL del avatar (absoluta o relativa a la API). */
    src?: string | null
    /** Se usa para la inicial cuando no hay avatar. */
    name?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    src: null,
    name: '',
  })

  const broken = ref(false)
  const url = computed(() => resolveAvatarUrl(props.src))
  const initial = computed(() => props.name.trim().charAt(0).toUpperCase() || '?')

  watch(url, () => {
    broken.value = false
  })
</script>

<template>
  <span
    class="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-primary-foreground"
    aria-hidden="true"
  >
    <img
      v-if="url && !broken"
      :src="url"
      alt=""
      class="size-full object-cover"
      @error="broken = true"
    />
    <span v-else class="text-xs font-semibold">{{ initial }}</span>
  </span>
</template>
