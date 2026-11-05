import type { FastifyReply, FastifyRequest } from 'fastify'
import type { UserRole } from '@prisma/client'
import { AppError } from './errors'

export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'No autenticado')
    }

    if (!roles.includes(request.user.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Sin permisos para esta operación')
    }
  }
}

export function requireTenant(request: FastifyRequest): string {
  if (!request.tenantId) {
    throw new AppError(401, 'UNAUTHORIZED', 'Sesión o token de staff requerido')
  }

  return request.tenantId
}
