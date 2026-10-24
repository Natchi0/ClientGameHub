import { z } from 'zod'
import { MatchVisibility } from './types'
/** Estado del formulario de creación de partida. Los valores de configuración van
 * indexados por id de GameConfiguration (string, como los maneja la UI). */
export interface CreateMatchFormValues {
  gameId: number | null
  /** Número crudo del enum (la UI lo valida contra MatchVisibility). */
  visibility: number
  seat: number | null
  password: string
  configurationValues: Record<string, string>
}

/**
 * Schema del formulario de creación. `requiredConfigurationIds` son las configuraciones
 * de juego obligatorias del juego elegido en el momento de validar.
 */
export function createMatchFormSchema(
  requiredConfigurationIds: readonly number[],
): z.ZodType<CreateMatchFormValues> {
  return z
    .object({
      gameId: z.number().int().positive().nullable(),
      visibility: z.number(),
      seat: z.number().int().positive().nullable(),
      password: z.string(),
      configurationValues: z.record(z.string(), z.string()),
    })
    .superRefine((data, ctx) => {
      if (data.gameId === null) {
        ctx.addIssue({ code: 'custom', path: ['gameId'], message: 'Elegí un juego.' })
      }
      if (data.seat === null) {
        ctx.addIssue({ code: 'custom', path: ['seat'], message: 'Elegí un asiento.' })
      }
      if (data.visibility === MatchVisibility.Private && !data.password.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['password'],
          message: 'Ingresá una contraseña o generá una.',
        })
      }
      for (const id of requiredConfigurationIds) {
        if (!(data.configurationValues[String(id)] ?? '').trim()) {
          ctx.addIssue({
            code: 'custom',
            path: ['configurationValues'],
            message: 'Completá las opciones obligatorias de la partida.',
          })
          break
        }
      }
    })
}

export type CreateMatchFormSchema = z.ZodType<CreateMatchFormValues>
