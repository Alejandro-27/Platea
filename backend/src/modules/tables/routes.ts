import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../../config/env'
import { requireRole, requireTenant } from '../../lib/guards'
import { parse } from '../../lib/validation'
import { paginationMeta, paginationSchema } from '../../lib/pagination'
import { notFound } from '../../lib/errors'
import { generateQrCode } from '../../lib/qr'

const paramsSchema = z.object({ id: z.string().min(1) })

const listQuerySchema = paginationSchema.extend({
  isActive: z.enum(['true', 'false']).optional(),
})

const createSchema = z.object({
  number: z.number().int().positive(),
  isActive: z.boolean().default(true),
})

const updateSchema = z
  .object({
    number: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Nada que actualizar')

export default async function tablesRoutes(app: FastifyInstance): Promise<void> {
  const adminOnly = { preHandler: [app.authenticate, requireRole('ADMIN')] }

  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    requireTenant(request)
    const query = parse(listQuerySchema, request.query)
    const where = query.isActive ? { isActive: query.isActive === 'true' } : {}

    const [tables, total] = await Promise.all([
      request.db.table.findMany({
        where,
        orderBy: { number: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      request.db.table.count({ where }),
    ])

    return { data: tables, meta: paginationMeta(total, query.page, query.limit) }
  })

  app.post('/', adminOnly, async (request, reply) => {
    const tenantId = requireTenant(request)
    const body = parse(createSchema, request.body)

    const table = await request.db.table.create({
      data: { tenantId, number: body.number, isActive: body.isActive, qrCode: generateQrCode() },
    })

    return reply.code(201).send({ data: table })
  })

  app.patch('/:id', adminOnly, async (request) => {
    const { id } = parse(paramsSchema, request.params)
    const body = parse(updateSchema, request.body)

    const existing = await request.db.table.findFirst({ where: { id } })
    if (!existing) throw notFound('Mesa')

    return { data: await request.db.table.update({ where: { id }, data: body }) }
  })

  app.get('/:id/qr', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = parse(paramsSchema, request.params)
    const tenantId = requireTenant(request)

    const table = await request.db.table.findFirst({ where: { id } })
    if (!table) throw notFound('Mesa')

    return {
      data: {
        tableId: table.id,
        number: table.number,
        qrCode: table.qrCode,
        url: `${env.FRONTEND_URL}/menu/${tenantId}?table=${table.id}`,
      },
    }
  })

  // Borrado lógico: la mesa puede tener sesiones y pedidos históricos.
  app.delete('/:id', adminOnly, async (request) => {
    const { id } = parse(paramsSchema, request.params)

    const existing = await request.db.table.findFirst({ where: { id } })
    if (!existing) throw notFound('Mesa')

    return { data: await request.db.table.update({ where: { id }, data: { isActive: false } }) }
  })
}
