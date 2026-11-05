import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { parse } from '../../lib/validation'
import { requireTenant } from '../../lib/guards'
import { AppError, notFound } from '../../lib/errors'

const createSchema = z.object({
  dishId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

function sessionIdFrom(request: FastifyRequest): string {
  const header = request.headers['x-session-id']
  if (typeof header !== 'string' || header.length === 0) {
    throw new AppError(401, 'UNAUTHORIZED', 'Header x-session-id requerido')
  }
  return header
}

export default async function reviewsRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/reviews',
    { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const tenantId = requireTenant(request)
      const sessionId = sessionIdFrom(request)
      const body = parse(createSchema, request.body)

      const [session, dish] = await Promise.all([
        request.db.session.findFirst({ where: { id: sessionId }, select: { id: true } }),
        request.db.dish.findFirst({ where: { id: body.dishId }, select: { id: true } }),
      ])

      if (!session) throw new AppError(401, 'UNAUTHORIZED', 'Sesión inválida')
      if (!dish) throw notFound('Plato')

      const review = await request.db.$transaction(async (tx) => {
        const created = await tx.review.create({
          data: {
            tenantId,
            dishId: body.dishId,
            sessionId,
            rating: body.rating,
            comment: body.comment,
          },
        })

        const stats = await tx.review.aggregate({
          where: { dishId: body.dishId, tenantId },
          _avg: { rating: true },
          _count: true,
        })

        await tx.dish.update({
          where: { id: body.dishId, tenantId },
          data: {
            averageRating: stats._avg.rating ?? 0,
            reviewCount: stats._count,
          },
        })

        return created
      })

      return reply.code(201).send({ data: review })
    }
  )
}
