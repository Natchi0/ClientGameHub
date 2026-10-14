import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { authApi } from '../api/authApi'
import type { LoginRequest, RegisterRequest, UserDto } from '../types'
import { hasRoleAtLeast } from '../roles'
import { decodeJwt } from '@/shared/lib/jwt'
import { accessToken } from '@/shared/lib/tokenStorage'
import { isUnauthorized, refreshSession } from '@/shared/lib/http'
import { appConfig } from '@/shared/config'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserDto | null>(null)

  const token = computed(() => accessToken.value) // solo lectura
  const claims = computed(() => decodeJwt(accessToken.value))
  const hasSession = computed(() => !!claims.value) // tiene CUALQUIER tipo de sesión iniciada
  const isGuest = computed(() => claims.value?.isGuest ?? true)
  const isRegistered = computed(() => !!claims.value && !claims.value.isGuest) //tiene una cuenta no anónima
  const roles = computed(() => claims.value?.roles ?? [])

  // si cambia la identidad (login, logout, otra pestaña, sesión perdida), el perfil cacheado ya no vale
  watch(
    () => claims.value?.sub,
    () => {
      user.value = null
    },
    { flush: 'sync' },
  )

  function setToken(newToken: string) {
    accessToken.value = newToken
  }

  function clearSession() {
    accessToken.value = null
    user.value = null
  }

  function hasRole(required: string) {
    return hasRoleAtLeast(roles.value, required)
  }

  async function fetchUser() {
    user.value = await authApi.getMe()
  }

  async function startGuest() {
    clearSession()
    const { token } = await authApi.registerGuest()
    setToken(token)
    await fetchUser()
  }

  function needsRefresh() {
    const exp = claims.value?.exp
    // sin token, inválido o por vencer
    return !exp || exp * 1000 - appConfig.auth.tokenRefreshMargin <= Date.now() //exp es segundos y Date.now() son milisegundos
  }

  async function doEnsureSession() {
    if (needsRefresh()) {
      try {
        await refreshSession() // 1) con cookie, recupera la sesión existente
      } catch (e) {
        if (!isUnauthorized(e)) throw e // red caída / 5xx: NO crear guest
        return startGuest() // 2) sin sesión recuperable: nuevo guest
      }
    }

    if (user.value) return
    try {
      await fetchUser()
    } catch (e) {
      if (!isUnauthorized(e)) throw e
      return startGuest()
    }
  }

  // evita carreras: varias navegaciones simultáneas comparten la misma operación
  let inflight: Promise<void> | null = null
  function single(task: () => Promise<void>) {
    return (inflight ??= task().finally(() => {
      inflight = null
    }))
  }

  /** Garantiza sesión válida (refresh -> guest) y perfil cargado. Llamar desde el guard. */
  const ensureSession = () => single(doEnsureSession)

  async function login(credentials: LoginRequest) {
    const response = await authApi.login(credentials)
    setToken(response.token)
    user.value = response.user // después de setToken: el watcher de `sub` ya limpió el anterior
  }

  async function register(payload: RegisterRequest) {
    const { token } = await authApi.registerAccount(payload)
    setToken(token) // mismo `sub`: `user` queda viejo hasta el fetch
    await fetchUser()
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      /* sin red */
    }
    clearSession()
    await single(startGuest)
  }

  return {
    user,
    token,
    claims,
    hasSession,
    isGuest,
    isRegistered,
    roles,
    hasRole,
    ensureSession,
    fetchUser,
    login,
    register,
    logout,
  }
})
