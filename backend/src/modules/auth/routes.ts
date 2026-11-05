import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { verifyPassword } from '../../lib/password'
import { signToken } from '../../lib/jwt'
import { parse } from '../../lib/validation'
import { AppError } from '../../lib/errors'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export default async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/login',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request) => {
      const { email, password } = parse(loginSchema, request.body)

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          tenant: { select: { id: true, name: true, slug: true, isActive: true } },
        },
      })

      const validPassword = user ? await verifyPassword(password, user.passwordHash) : false

      if (!user || (user.tenant !== null && !user.tenant.isActive) || !validPassword) {
        throw new AppError(401, 'UNAUTHORIZED', 'Credenciales inválidas')
      }

      const token = signToken({
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
        email: user.email,
      })

      return {
        data: {
          token,
          user: { id: user.id, email: user.email, role: user.role },
          tenant: user.tenant
            ? { id: user.tenant.id, name: user.tenant.name, slug: user.tenant.slug }
            : null,
        },
      }
    }
  )

  app.get('/me', { preHandler: [app.authenticate] }, async (request) => {
    const user = await request.db.user.findFirst({
      where: { id: request.user.sub },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        tenant: { select: { id: true, name: true, slug: true } },
      },
    })

    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Usuario no encontrado')

    return { data: user }
  })
}
