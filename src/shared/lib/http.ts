import axios from 'axios'
import { appConfig } from '../config'

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
  const token = localStorage.getItem(appConfig.storage.token)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string> | null = null
const NO_REFRESH = ['/auth/login', '/auth/refresh', '/auth/anonymous']

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const skip = NO_REFRESH.some((url) => originalRequest?.url?.includes(url))
    if (error.response?.status !== 401 || originalRequest._retry || skip) {
      return Promise.reject(error)
    }

    originalRequest._retry = true
    try {
      // refrescar el token usando la cookie HttpOnly
      refreshPromise ??= axios
        .post(`${http.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true })
        .then((r) => r.data.token as string)
        .finally(() => {
          refreshPromise = null
        })

      const token = await refreshPromise
      localStorage.setItem(appConfig.storage.token, token)
      originalRequest.headers.Authorization = `Bearer ${token}`
      return http(originalRequest)
    } catch (e) {
      localStorage.removeItem(appConfig.storage.token)
      return Promise.reject(e) // el guard decide a dónde ir, sin recargar la página
    }
  },
)
