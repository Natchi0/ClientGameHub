import { describe, expect, it } from 'vitest'
import { resolveLayout } from '@/app/layouts'

describe('resolveLayout', () => {
  it('devuelve el layout por defecto cuando la ruta no pide ninguno', () => {
    expect(resolveLayout(undefined)).toBe(resolveLayout('default'))
  })

  it('devuelve el layout pedido por la ruta', () => {
    expect(resolveLayout('auth')).not.toBe(resolveLayout('default'))
  })

  it('cae en el layout por defecto si el nombre no existe', () => {
    expect(resolveLayout('sidebar')).toBe(resolveLayout('default'))
  })
})
