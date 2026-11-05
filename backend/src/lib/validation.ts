import type { ZodType } from 'zod'
import { AppError } from './errors'

export function parse<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input)

  if (!result.success) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Datos inválidos', result.error.issues)
  }

  return result.data
}
