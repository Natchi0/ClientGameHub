import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email().min(1, 'Requerido'),
  password: z.string().min(1, 'Requerido'),
})

export const registerSchema = z
  .object({
    nickname: z.string().min(3, 'Mínimo 3 caracteres').max(20, 'Máximo 20 caracteres'),
    email: z.email().min(1, 'Requerido'),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, { message: 'Debe contener al menos una mayúscula' })
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string().min(1, 'Requerido'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  })

export type LoginRequest = z.infer<typeof loginSchema>
export type RegisterForm = z.infer<typeof registerSchema>
export type RegisterRequest = Omit<RegisterForm, 'confirmPassword'>
