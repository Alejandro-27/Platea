import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { parse } from '../../lib/validation'
import { requireTenant } from '../../lib/guards'
import { AppError, notFound } from '../../lib/errors'
import { emitNewOrder, orderInclude } from './service'

const createSchema = z.object({
  items: z
    .array(
      z.object({
        dishId: z.string().min(1),
        quantity: z.number().int().positive().max(99),
        notes: z.string().max(300).optional(),
      }),
    )
    .min(1)
    .max(50),
  notes: z.string().max(1000).optional(),
})

const paramsSchema = z.object({ id: z.string().min(1) })

function sessionIdFrom(request: FastifyRequest): string {
  const header = request.headers['x-session-id']
  if (typeof header !== 'string' || header.length === 0) {
    throw new AppError(401, 'UNAUTHORIZED', 'Header x-session-id requerido')
  }
  return header
}

export default async function publicOrderRoutes(app: FastifyInstance): Promise<void> {
  app.post('/orders', async (request, reply) => {
    const tenantId = requireTenant(request)
    const sessionId = sessionIdFrom(request)
    const body = parse(createSchema, request.body)

    const session = await request.db.session.findFirst({
      where: { id: sessionId },
      select: { id: true, tableId: true, expiresAt: true },
    })

    if (!session) throw new AppError(401, 'UNAUTHORIZED', 'Sesión inválida')
    if (session.expiresAt <= new Date()) {
      throw new AppError(410, 'SESSION_EXPIRED', 'La sesión expiró')
    }

    const dishIds = [...new Set(body.items.map((item) => item.dishId))]
    const dishes = await request.db.dish.findMany({
      where: { id: { in: dishIds }, isAvailable: true },
      select: { id: true, name: true, price: true, isOutOfStock: true },
    })
    const dishesById = new Map(dishes.map((dish) => [dish.id, dish]))

    const lines = body.items.map((item) => {
      const dish = dishesById.get(item.dishId)
      if (!dish) {
        throw new AppError(422, 'VALIDATION_ERROR', 'Uno o más platos no están disponibles')
      }
      if (dish.isOutOfStock) {
        throw new AppError(409, 'DISH_OUT_OF_STOCK', `${dish.name} está agotado`)
      }
      return { dish, quantity: item.quantity, notes: item.notes }
    })

    // El total se calcula con los precios de la base, nunca con el payload.
    const total = lines.reduce(
      (sum, line) => sum.add(line.dish.price.mul(line.quantity)),
      new Prisma.Decimal(0),
    )

    const order = await request.db.order.create({
      data: {
        tenantId,
        sessionId: session.id,
        tableId: session.tableId,
        notes: body.notes,
        total,
        items: {
          create: lines.map((line) => ({
            dishId: line.dish.id,
            quantity: line.quantity,
            notes: line.notes,
            price: line.dish.price,
          })),
        },
      },
      include: orderInclude,
    })

    emitNewOrder(app.io, order)

    return reply.code(201).send({ data: order })
  })

  app.get('/orders/:id', async (request) => {
    const sessionId = sessionIdFrom(request)
    const { id } = parse(paramsSchema, request.params)

    const order = await request.db.order.findFirst({
      where: { id, sessionId },
      include: orderInclude,
    })

    if (!order) throw notFound('Pedido')

    return { data: order }
  })
}
