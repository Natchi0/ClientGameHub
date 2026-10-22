import { appConfig } from '@/shared/config'

/**
 * Resuelve la URL del avatar devuelta por la API.
 * Las absolutas (http/https/data) se usan tal cual; las relativas se anclan al origen de la API,
 * que es donde el backend expone los archivos estáticos (`/avatars/...`).
 */
export function resolveAvatarUrl(avatar: string | null | undefined): string | null {
  if (!avatar) return null

  try {
    const base = new URL(appConfig.api.baseUrl)
    return new URL(avatar, base.origin).toString()
  } catch {
    return avatar
  }
}
