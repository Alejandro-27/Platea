import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { canTransitionItem, canTransitionOrder } from '../../lib/order-status'
import { parse } from '../../lib/validation'
import { requireTenant } from '../../lib/guards'
import { paginationMeta, paginationSchema } from '../../lib/pagination'
import { AppError, notFound } from '../../lib/errors'
import { deductIngredients, emitOrderUpdated, orderInclude } from './service'

const orderStatusSchema = z.enum(['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'])
const itemStatusSchema = z.enum(['PENDING', 'PREPARING', 'READY', 'SERVED'])

const listQuerySchema = paginationSchema.extend({
  status: orderStatusSchema.optional(),
})

const statusSchema = z.object({ status: orderStatusSchema })
const itemStatusBodySchema = z.object({ status: itemStatusSchema })
const paramsSchema = z.object({ id: z.string().min(1) })
const itemParamsSchema = z.object({ id: z.string().min(1), itemId: z.string().min(1) })

export default async function staffOrderRoutes(app: FastifyInstance): Promise<void> {
  const staffOnly = { preHandler: [app.authenticate] }

  app.get('/', staffOnly, async (request) => {
    const query = parse(listQuerySchema, request.query)
    const where = query.status ? { status: query.status } : {}

    const [orders, total] = await Promise.all([
      request.db.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      request.db.order.count({ where }),
    ])

    return { data: orders, meta: paginationMeta(total, query.page, query.limit) }
  })

  app.patch('/:id/status', staffOnly, async (request) => {
    const tenantId = requireTenant(request)
    const { id } = parse(paramsSchema, request.params)
    const body = parse(statusSchema, request.body)

    const order = await request.db.order.findFirst({
      where: { id },
      include: {
        items: {
          include: {
            dish: {
              select: {
                id: true,
                name: true,
                dishIngredients: { select: { ingredientId: true, quantity: true } },
              },
            },
          },
        },
      },
    })

    if (!order) throw notFound('Pedido')

    if (!canTransitionOrder(order.status, body.status)) {
      throw new AppError(
        409,
        'INVALID_STATUS_TRANSITION',
        `No se puede pasar de ${order.status} a ${body.status}`,
      )
    }

    const updated = await request.db.$transaction(async (tx) => {
      if (body.status === 'PREPARING') {
        for (const item of order.items) {
          if (item.itemStatus === 'PENDING') {
            await deductIngredients(tx, tenantId, item)
          }
        }
        await tx.orderItem.updateMany({
          where: { orderId: id, itemStatus: 'PENDING' },
          data: { itemStatus: 'PREPARING' },
        })
      }

      if (body.status === 'READY') {
        await tx.orderItem.updateMany({
          where: { orderId: id, itemStatus: { in: ['PENDING', 'PREPARING'] } },
          data: { itemStatus: 'READY' },
        })
      }

      if (body.status === 'SERVED') {
        await tx.orderItem.updateMany({
          where: { orderId: id, itemStatus: { in: ['PENDING', 'PREPARING', 'READY'] } },
          data: { itemStatus: 'SERVED' },
        })
      }

      return tx.order.update({
        where: { id, tenantId },
        data: { status: body.status },
        include: orderInclude,
      })
    })

    emitOrderUpdated(app.io, updated)

    return { data: updated }
  })

  app.patch('/:id/items/:itemId/status', staffOnly, async (request) => {
    const tenantId = requireTenant(request)
    const { id, itemId } = parse(itemParamsSchema, request.params)
    const body = parse(itemStatusBodySchema, request.body)

    const order = await request.db.order.findFirst({
      where: { id },
      include: {
        items: {
          where: { id: itemId },
          include: {
            dish: {
              select: {
                dishIngredients: { select: { ingredientId: true, quantity: true } },
              },
            },
          },
        },
      },
    })

    if (!order) throw notFound('Pedido')
    const item = order.items[0]
    if (!item) throw notFound('Ítem')

    if (!canTransitionItem(item.itemStatus, body.status)) {
      throw new AppError(
        409,
        'INVALID_STATUS_TRANSITION',
        `No se puede pasar de ${item.itemStatus} a ${body.status}`,
      )
    }

    const updated = await request.db.$transaction(async (tx) => {
      if (body.status === 'PREPARING') {
        await deductIngredients(tx, tenantId, item)
      }

      await tx.orderItem.update({ where: { id: itemId }, data: { itemStatus: body.status } })

      return tx.order.findFirst({ where: { id, tenantId }, include: orderInclude })
    })

    if (!updated) throw notFound('Pedido')

    emitOrderUpdated(app.io, updated)

    return { data: updated }
  })
}
