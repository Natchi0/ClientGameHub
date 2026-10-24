import { isAxiosError } from 'axios'

export interface NormalizedError {
  message: string | null
  fieldErrors: Record<string, string>
}

export function normalizeApiError(err: unknown): NormalizedError {
  if (!isAxiosError(err)) return { message: 'Error inesperado', fieldErrors: {} }
  if (!err.response) return { message: 'No se pudo conectar con el servidor', fieldErrors: {} }

  const { status, data } = err.response
  if (status === 401) return { message: 'Credenciales inválidas', fieldErrors: {} }
  if (typeof data === 'string') return { message: data, fieldErrors: {} } // Results.Conflict("...")
  if (typeof data?.error === 'string') return { message: data.error, fieldErrors: {} } // Results.BadRequest(new { error })

  const fieldErrors: Record<string, string> = {}
  if (data?.errors && typeof data.errors === 'object') {
    // ValidationProblem
    for (const [key, msgs] of Object.entries(data.errors)) {
      const firstMessage = Array.isArray(msgs) ? msgs[0] : undefined
      if (firstMessage) {
        fieldErrors[key.charAt(0).toLowerCase() + key.slice(1)] = firstMessage // "Email" -> "email"
      }
    }
  }
  return { message: data?.title ?? 'Error del servidor', fieldErrors }
}
