import { describe, expect, it } from 'vitest'
import { createMatchFormSchema, type CreateMatchFormValues } from '../schemas'
import { MatchVisibility } from '../types'

function baseValues(overrides: Partial<CreateMatchFormValues> = {}): CreateMatchFormValues {
  return {
    gameId: 1,
    visibility: MatchVisibility.Public,
    seat: 2,
    password: '',
    configurationValues: {},
    ...overrides,
  }
}

function fieldErrors(values: CreateMatchFormValues, required: number[] = []) {
  const result = createMatchFormSchema(required).safeParse(values)
  if (result.success) return {} as Record<string, string>
  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) errors[String(issue.path[0])] = issue.message
  return errors
}

describe('createMatchFormSchema', () => {
  it('acepta un formulario completo', () => {
    expect(
      createMatchFormSchema([]).safeParse(baseValues({ configurationValues: { '3': '10' } }))
        .success,
    ).toBe(true)
  })

  it('exige elegir juego y asiento', () => {
    const errors = fieldErrors(baseValues({ gameId: null, seat: null }))
    expect(errors.gameId).toBe('Elegí un juego.')
    expect(errors.seat).toBe('Elegí un asiento.')
  })

  it('exige contraseña para partidas privadas', () => {
    const vacia = fieldErrors(baseValues({ visibility: MatchVisibility.Private, password: '' }))
    expect(vacia.password).toBe('Ingresá una contraseña o generá una.')

    const espacios = fieldErrors(
      baseValues({ visibility: MatchVisibility.Private, password: '   ' }),
    )
    expect(espacios.password).toBe('Ingresá una contraseña o generá una.')

    const ok = fieldErrors(baseValues({ visibility: MatchVisibility.Private, password: 'clave' }))
    expect(ok.password).toBeUndefined()
  })

  it('no exige contraseña para partidas públicas', () => {
    const errors = fieldErrors(baseValues({ visibility: MatchVisibility.Public }))
    expect(errors.password).toBeUndefined()
  })

  it('exige las opciones obligatorias del juego elegido', () => {
    const errors = fieldErrors(baseValues(), [3])
    expect(errors.configurationValues).toBe('Completá las opciones obligatorias de la partida.')

    const conEspacios = fieldErrors(baseValues({ configurationValues: { '3': '   ' } }), [3])
    expect(conEspacios.configurationValues).toBe(
      'Completá las opciones obligatorias de la partida.',
    )

    const ok = fieldErrors(baseValues({ configurationValues: { '3': '10' } }), [3])
    expect(ok.configurationValues).toBeUndefined()
  })

  it('ignora configuraciones no obligatorias vacías', () => {
    expect(createMatchFormSchema([]).safeParse(baseValues()).success).toBe(true)
  })
})
