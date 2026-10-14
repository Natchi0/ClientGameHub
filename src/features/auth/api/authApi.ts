import { http } from '@/shared/lib/http'
import type { LoginRequest, RegisterRequest, AuthResponse, UserDto } from '../types'

export interface TokenResponse {
  token: string
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { data } = await http.post<AuthResponse>('/auth/login', credentials)
    return data
  },

  async registerGuest(): Promise<TokenResponse> {
    const { data } = await http.post<TokenResponse>('/auth/anonymous')
    return data
  },

  async registerAccount(payload: RegisterRequest): Promise<TokenResponse> {
    const { data } = await http.post<TokenResponse>('/auth/register', payload)
    return data
  },

  async getMe(): Promise<UserDto> {
    const { data } = await http.get<UserDto>('/auth/me')
    return data
  },

  async logout() {
    http.post('/auth/logout')
  },
}
