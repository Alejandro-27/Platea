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
 * Cliente Prisma acotado a un tenant. La lógica de inyección vive en
 * applyTenantScope (probada en tenant-scope.test.ts).
 */
export function tenantClient(tenantId: string): PrismaClient {
  if (!tenantId) throw new Error('tenantClient: tenantId es obligatorio')

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
