interface LoginRequest {
  email: string
  password: string
}

interface RegisterRequest {
  email: string
  password: string
  nickname: string
}

interface AuthResponse {
  token: string
  user: UserDto
}

interface UserDto {
  id: number
  email: string | null
  nickname: string
  avatar: string | null
  roles: string[]
}

export type { LoginRequest, RegisterRequest, AuthResponse, UserDto }
