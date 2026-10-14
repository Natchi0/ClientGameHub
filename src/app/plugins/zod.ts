import { z } from 'zod'

export function setupZod() {
  z.config(z.locales.es())
}
