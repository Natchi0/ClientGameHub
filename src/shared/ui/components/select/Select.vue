<script setup lang="ts">
  import type { SelectRootEmits, SelectRootProps } from 'reka-ui'
  import { SelectRoot, useForwardPropsEmits } from 'reka-ui'

  const props = defineProps<SelectRootProps>()
  const emits = defineEmits<SelectRootEmits>()

  const forwarded = useForwardPropsEmits(props, emits)
</script>

<!-- SelectRoot no renderiza DOM: attrs como class en <Select> no llegan a ninguna parte.
     Las clases de ancho (w-*, flex-1, etc.) van en el SelectTrigger. -->
<template>
  <SelectRoot v-slot="slotProps" data-slot="select" v-bind="forwarded">
    <slot v-bind="slotProps" />
  </SelectRoot>
</template>
