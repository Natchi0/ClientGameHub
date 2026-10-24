import { reactive, ref, type Ref } from 'vue'
import type { z } from 'zod'
import { normalizeApiError } from '@/shared/lib/apiError'

export interface ZodFormApi<T extends object> {
  values: T
  errors: Ref<Record<string, string>>
  formError: Ref<string | null>
  submitting: Ref<boolean>
  validateField: (name: keyof T & string) => void
  handleSubmit: (onValid: (data: T) => Promise<void>) => () => Promise<void>
}

/**
 * Estado, validación y envío de formularios con zod.
 *
 * `schema` puede ser un schema de zod o una función que lo genera en el momento
 * del parse, para cuando la validación depende de contexto dinámico (ej. reglas
 * que dependen del juego elegido en el momento de enviar).
 */
export function useZodForm<T extends object>(
  schema: z.ZodType<T> | (() => z.ZodType<T>),
  initial: T,
): ZodFormApi<T> {
  const values = reactive({ ...initial }) as T
  const errors = ref<Record<string, string>>({})
  const formError = ref<string | null>(null)
  const submitting = ref(false)

  function resolve(): z.ZodType<T> {
    return typeof schema === 'function' ? schema() : schema
  }

  function parse() {
    const result = resolve().safeParse(values)
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
