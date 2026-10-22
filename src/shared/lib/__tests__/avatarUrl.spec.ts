import { describe, expect, it } from 'vitest'
import { resolveAvatarUrl } from '@/shared/lib/avatarUrl'

describe('resolveAvatarUrl', () => {
  it('devuelve null cuando no hay avatar', () => {
    expect(resolveAvatarUrl(null)).toBeNull()
    expect(resolveAvatarUrl(undefined)).toBeNull()
    expect(resolveAvatarUrl('')).toBeNull()
  })

  it('ancla las rutas relativas al origen de la API', () => {
    expect(resolveAvatarUrl('/avatars/abc.webp')).toBe('http://localhost:5045/avatars/abc.webp')
  })

  it('respeta las URLs absolutas', () => {
    expect(resolveAvatarUrl('https://cdn.gamehub.dev/a.png')).toBe('https://cdn.gamehub.dev/a.png')
  })
})
