<script setup lang="ts">
  defineProps<{ label: string; type?: string; error?: string; autocomplete?: string }>()
  defineEmits<{ blur: [] }>()
  const model = defineModel<string>({ required: true })
</script>

<template>
  <div class="space-y-1">
    <label class="block text-sm font-medium">
      {{ label }}
      <input
        v-model="model"
        :type="type ?? 'text'"
        :autocomplete="autocomplete"
        :aria-invalid="!!error"
        class="mt-1 block w-full rounded border px-3 py-2"
        :class="error ? 'border-red-500' : 'border-gray-300'"
        @blur="$emit('blur')"
        id="asd"
        data-pepe="aaaa"
      />
    </label>
    <p
      v-if="error"
      class="text-sm text-red-600"
    >
      {{ error }}
    </p>
  </div>
</template>
