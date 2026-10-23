<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { resolveAvatarUrl } from '@/shared/lib/avatarUrl'

  type AvatarSize = 'sm' | 'md' | 'lg'

  interface Props {
    /** URL del avatar (absoluta o relativa a la API). */
    src?: string | null
    /** Se usa para la inicial cuando no hay avatar. */
    name?: string
    /** Tamaño del avatar. */
    size?: AvatarSize
  }

  const props = withDefaults(defineProps<Props>(), {
    src: null,
    name: '',
    size: 'sm',
  })

  const SIZE_CLASSES: Record<AvatarSize, { root: string; label: string }> = {
    sm: { root: 'size-8', label: 'text-xs' },
    md: { root: 'size-10', label: 'text-sm' },
    lg: { root: 'size-20', label: 'text-2xl' },
  }

  const broken = ref(false)
  const url = computed(() => resolveAvatarUrl(props.src))
  const initial = computed(() => props.name.trim().charAt(0).toUpperCase() || '?')
  const sizeClasses = computed(() => SIZE_CLASSES[props.size])

  watch(url, () => {
    broken.value = false
  })
</script>

<template>
  <span
    :class="[
      'grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-primary-foreground',
      sizeClasses.root,
    ]"
    aria-hidden="true"
  >
    <img
      v-if="url && !broken"
      :src="url"
      alt=""
      class="size-full object-cover"
      @error="broken = true"
    />
    <span v-else :class="['font-semibold', sizeClasses.label]">{{ initial }}</span>
  </span>
</template>
