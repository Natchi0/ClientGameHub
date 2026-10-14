import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/authApi'
import type { LoginRequest, RegisterRequest, UserDto } from '../types'
import { decodeJwt } from '@/shared/lib/jwt'
import { appConfig } from '@/shared/config'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(appConfig.storage.token))
  const user = ref<UserDto | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const claims = computed(() => decodeJwt(token.value))
  const isGuest = computed(() => claims.value?.isGuest ?? true)
  const isRegistered = computed(() => !!claims.value && !claims.value.isGuest)
  const roles = computed(() => claims.value?.roles ?? []) // reemplaza al que leía user.roles

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem(appConfig.storage.token, newToken)
  }

  async function fetchUser() {
    if (!token.value) return
    try {
      user.value = await authApi.getMe()
    } catch {
      logout()
    }
  }

  async function login(credentials: LoginRequest) {
    const response = await authApi.login(credentials)
    setToken(response.token)
    user.value = response.user
  }

  async function initGuest() {
    if (!token.value) {
      const response = await authApi.registerGuest()
      setToken(response.token)
      await fetchUser()
    } else if (!user.value) {
      await fetchUser()
    }
  }

  async function register(payload: RegisterRequest) {
    const { token } = await authApi.registerAccount(payload)
    setToken(token)
    await fetchUser()
  }

  function hasRole(roleName: string) {
    return roles.value.includes(roleName)
  }

  /**
   * Limpia la sesión local
   */
  function clearSession() {
    token.value = null
    user.value = null
    localStorage.removeItem(appConfig.storage.token)
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      /* sin red o token vencido: igual limpiamos */
    }
    clearSession()
    await initGuest()
  }

  return {
    token,
    user,
    claims,
    isGuest,
    isRegistered,
    isAuthenticated,
    roles,
    setToken,
    login,
    initGuest,
    fetchUser,
    register,
    hasRole,
    logout,
  }
})
