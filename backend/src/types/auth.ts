import type { UserRole } from '@prisma/client'

/** Payload del JWT propio de Platea (staff del restaurante). */
export type AuthUser = {
  sub: string
  email: string
  role: UserRole
  tenantId: string
}
