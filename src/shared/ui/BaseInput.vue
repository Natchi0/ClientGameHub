<script setup lang="ts">
import { computed, useId } from 'vue'
import { Input } from '@/shared/ui/components/input'

defineProps<{ label: string; type?: string; error?: string; autocomplete?: string }>()
defineEmits<{ blur: [] }>()
const model = defineModel<string>({ required: true })
const inputId = useId()
const errorId = computed(() => `${inputId}-error`)
</script>

<template>
  <div class="space-y-1.5">
    <label :for="inputId" class="block text-sm font-medium text-foreground">
      {{ label }}
    </label>
    <Input
      :id="inputId"
      v-model="model"
      :type="type ?? 'text'"
      :autocomplete="autocomplete"
      :aria-invalid="!!error"
      :aria-describedby="error ? errorId : undefined"
      class="h-11 py-2.5"
      @blur="$emit('blur')"
    />
    <p
      v-if="error"
      :id="errorId"
      class="text-sm text-danger"
    >
      {{ error }}
    </p>
  </div>
</template>
