export interface JwtClaims {
  sub: string
  nickname: string
  isGuest: boolean
  roles: string[]
  exp: number
}

export function decodeJwt(token: string | null): JwtClaims | null {
  if (token == null) return null

  try {
    const payload = token.split('.')[1]
    if (payload == null) return null

    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    const p = JSON.parse(new TextDecoder().decode(bytes)) // UTF-8 seguro (tildes en nicknames)
    const roles = Array.isArray(p.roles) ? p.roles : []

    return {
      sub: String(p.sub),
      nickname: String(p.nickname ?? ''),
      isGuest: p.isGuest === true || p.isGuest === 'true', // el backend lo emite como string
      roles,
      exp: Number(p.exp),
    }
  } catch {
    return null
  }
}
