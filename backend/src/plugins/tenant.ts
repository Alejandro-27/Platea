import fp from 'fastify-plugin'
import { getPrisma, prisma } from '../lib/prisma'
import type { AuthUser } from '../types/auth'

/**
 * Resuelve el tenant de cada request, en este orden:
 * 1. JWT de staff (Authorization: Bearer) -> tenantId del token.
 *    Si el token es inválido responde 401; nunca cae a modo anónimo.
 * 2. Sesión de comensal (x-session-id) -> tenantId de la Session vigente.
 * 3. :tenantId de la URL (endpoints públicos de menú).
 *
 * Deja request.tenantId y request.db (cliente Prisma ya acotado al tenant).
 */
export default fp(
  async (app) => {
    app.decorateRequest('tenantId', null)
    app.decorateRequest('db')

    app.addHook('onRequest', async (request) => {
      let tenantId: string | null = null

      if (request.headers.authorization?.startsWith('Bearer ')) {
        const payload = await request.jwtVerify<AuthUser>()
        tenantId = payload.tenantId
      } else {
        const sessionId = request.headers['x-session-id']
        if (typeof sessionId === 'string' && sessionId.length > 0) {
          const session = await prisma.session.findUnique({
            where: { id: sessionId },
            select: { tenantId: true, expiresAt: true },
          })
          if (session && session.expiresAt > new Date()) {
            tenantId = session.tenantId
          }
        }

        if (!tenantId) {
          const params = request.params as Record<string, unknown>
          if (typeof params.tenantId === 'string' && params.tenantId.length > 0) {
            tenantId = params.tenantId
          }
        }
      }

      request.tenantId = tenantId
      request.db = getPrisma(tenantId ?? undefined)
    })
  },
  { name: 'tenant' },
)
