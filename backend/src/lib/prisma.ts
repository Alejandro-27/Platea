import { PrismaClient } from '@prisma/client'
import { applyTenantScope, type PrismaArgs } from './tenant-scope'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * Devuelve el cliente base o uno acotado al tenant. La lógica de inyección
 * vive en applyTenantScope (probada en tenant-scope.test.ts).
 *
 * - Lecturas y escrituras por id: tenantId va en `where`.
 * - Creaciones: tenantId se fuerza en `data`, ignorando el del payload.
 */
export function getPrisma(tenantId?: string): PrismaClient {
  if (tenantId === undefined) return prisma
  if (tenantId.trim() === '') throw new Error('getPrisma: tenantId vacío')

  return prisma.$extends({
    name: 'tenant-isolation',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const scoped = applyTenantScope(model, operation, args as PrismaArgs, tenantId)
          return query(scoped)
        },
      },
    },
  }) as unknown as PrismaClient
}
