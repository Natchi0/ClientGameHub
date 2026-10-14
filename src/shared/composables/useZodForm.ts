import { reactive, ref } from 'vue'
import type { z } from 'zod'
import { normalizeApiError } from '@/shared/lib/apiError'

export function useZodForm<T extends Record<string, string>>(schema: z.ZodType<T>, initial: T) {
  const values = reactive({ ...initial }) as T
  const errors = ref<Record<string, string>>({})
  const formError = ref<string | null>(null)
  const submitting = ref(false)

  function parse() {
    const result = schema.safeParse(values)
    const fieldErrors: Record<string, string> = {}
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? '')
        if (key && !(key in fieldErrors)) fieldErrors[key] = issue.message
      }
    }
    return { data: result.success ? result.data : null, fieldErrors }
  }

  function validateField(name: keyof T & string) {
    const { fieldErrors } = parse()
    if (fieldErrors[name]) errors.value[name] = fieldErrors[name]
    else delete errors.value[name]
  }

  function handleSubmit(onValid: (data: T) => Promise<void>) {
    return async () => {
      formError.value = null
      const { data, fieldErrors } = parse()
      errors.value = fieldErrors
      if (!data) return

      submitting.value = true
      try {
        await onValid(data)
      } catch (e) {
        const n = normalizeApiError(e)
        const extra: string[] = []
        for (const [k, msg] of Object.entries(n.fieldErrors)) {
          if (k in values) errors.value[k] = msg
          else extra.push(msg) // errores del backend que no mapean a un campo
        }
        formError.value = [n.message, ...extra].filter(Boolean).join(' · ') || null
      } finally {
        submitting.value = false
      }
    }
  }

  return { values, errors, formError, submitting, validateField, handleSubmit }
}
