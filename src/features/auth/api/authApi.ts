import { http } from '@/shared/lib/http'
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types'

export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { data } = await http.post<AuthResponse>('/auth/login', credentials)
    return data
  },

  async registerGuest() {
    const { data } = await http.post('/auth/anonymous')
    return data // Retorna { token }
  },

  async registerAccount(payload: RegisterRequest) {
    const { data } = await http.post('/auth/register', payload)
    return data // Retorna { token }
  },

  async getMe() {
    const { data } = await http.get('/auth/me')
    return data // Retorna UserDto
  },

  async logout() {
    http.post('/auth/logout')
  },
}
