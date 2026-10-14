import axios, { isAxiosError } from 'axios'
import { appConfig } from '../config'
import { accessToken } from './tokenStorage'

//declaración unicamente para evitar el error de _retry, no afecta nada
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean
  }
}

export const http = axios.create({
  baseURL: appConfig.api.baseUrl,
  timeout: appConfig.api.timeoutMs,
  withCredentials: true, //refresh token
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para inyectar token automáticamente
http.interceptors.request.use((config) => {
  if (accessToken.value) {
    config.headers.Authorization = `Bearer ${accessToken.value}`
  }

  return config
})

export const isUnauthorized = (e: unknown) => isAxiosError(e) && e.response?.status === 401

const REFRESH_LOCK = 'gamehub-refresh'
let refreshPromise: Promise<string> | null = null

/**
 * Renueva el access token con la cookie HttpOnly.
 * - Una sola llamada en vuelo por pestaña (refreshPromise).
 * - Una sola entre pestañas (Web Locks): la cookie rota en cada refresh y compartirla
 *   entre dos refresh simultáneos haría fallar al segundo con un token ya revocado.
 * Lanza el error de axios: 401 = no hay sesión recuperable; otro = fallo transitorio.
 */
export function refreshSession(): Promise<string> {
  refreshPromise ??= (async () => {
    const before = localStorage.getItem(appConfig.storage.token)

    const run = async () => {
      // otra pestaña pudo refrescar mientras esperábamos el lock
      const current = localStorage.getItem(appConfig.storage.token)
      if (current && current !== before) {
        accessToken.value = current
        return current
      }

      const { data } = await axios.post<{ token: string }>(
        `${appConfig.api.baseUrl}/auth/refresh`,
        {},
        { withCredentials: true, timeout: appConfig.api.timeoutMs },
      )
      accessToken.value = data.token
      return data.token
    }

    return 'locks' in navigator ? navigator.locks.request(REFRESH_LOCK, run) : run()
  })().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

const NO_REFRESH = ['/auth/login', '/auth/refresh', '/auth/anonymous', '/auth/logout']

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!isAxiosError(error) || !error.config) return Promise.reject(error)

    const originalRequest = error.config
    const skip = NO_REFRESH.some((url) => originalRequest.url?.includes(url))
    if (error.response?.status !== 401 || originalRequest._retry || skip) {
      return Promise.reject(error)
    }

    originalRequest._retry = true
    let token: string
    try {
      token = await refreshSession()
    } catch (e) {
      // refresh token inválido: sesión perdida. El store limpia `user` al ver cambiar el `sub`;
      // el guard de navegación crea el guest.
      if (isUnauthorized(e)) accessToken.value = null
      return Promise.reject(e)
    }

    originalRequest.headers.Authorization = `Bearer ${token}`
    return http(originalRequest)
  },
)
