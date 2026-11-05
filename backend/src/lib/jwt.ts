import { createSigner, createVerifier } from 'fast-jwt'
import { z } from 'zod'
import { env } from '../config/env'
import type { AuthUser } from '../types/auth'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

const sign = createSigner({
  key: env.JWT_SECRET,
  algorithm: 'HS256',
  expiresIn: SEVEN_DAYS_MS,
})

const verify = createVerifier({
  key: env.JWT_SECRET,
  algorithms: ['HS256'],
})

const payloadSchema = z.object({
  sub: z.string().min(1),
  tenantId: z.string().min(1).nullable(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'KITCHEN']),
  email: z.string().min(1).optional(),
})

export type SignTokenInput = {
  userId: string
  tenantId: string | null
  role: AuthUser['role']
  email?: string
}

export function signToken({ userId, tenantId, role, email }: SignTokenInput): string {
  return sign({ sub: userId, tenantId, role, ...(email ? { email } : {}) })
}

export function verifyToken(token: string): AuthUser {
  return payloadSchema.parse(verify(token))
}
