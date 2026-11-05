import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireRole, requireTenant } from '../../lib/guards'
import { parse } from '../../lib/validation'
import { paginationMeta, paginationSchema } from '../../lib/pagination'
import { notFound } from '../../lib/errors'

const paramsSchema = z.object({ id: z.string().min(1) })

const listQuerySchema = paginationSchema.extend({
  search: z.string().min(1).optional(),
})

const decimal = z.coerce.number().min(0)

const createSchema = z.object({
  name: z.string().min(1).max(100),
  unit: z.string().min(1).max(20),
  currentStock: decimal.default(0),
  minStock: decimal.default(0),
  costPerUnit: decimal.optional(),
})

const updateSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    unit: z.string().min(1).max(20).optional(),
    currentStock: decimal.optional(),
    minStock: decimal.optional(),
    costPerUnit: decimal.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Nada que actualizar')

export default async function ingredientsRoutes(app: FastifyInstance): Promise<void> {
  const adminOnly = { preHandler: [app.authenticate, requireRole('ADMIN')] }

  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    const query = parse(listQuerySchema, request.query)
    const where = query.search
      ? { name: { contains: query.search, mode: 'insensitive' as const } }
      : {}

    const [ingredients, total] = await Promise.all([
      request.db.ingredient.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      request.db.ingredient.count({ where }),
    ])

    return { data: ingredients, meta: paginationMeta(total, query.page, query.limit) }
  })

  app.post('/', adminOnly, async (request, reply) => {
    const tenantId = requireTenant(request)
    const body = parse(createSchema, request.body)
    const ingredient = await request.db.ingredient.create({ data: { ...body, tenantId } })

    return reply.code(201).send({ data: ingredient })
  })

  app.patch('/:id', adminOnly, async (request) => {
    const { id } = parse(paramsSchema, request.params)
    const body = parse(updateSchema, request.body)

    const existing = await request.db.ingredient.findFirst({ where: { id } })
    if (!existing) throw notFound('Ingrediente')

    return { data: await request.db.ingredient.update({ where: { id }, data: body }) }
  })

  app.delete('/:id', adminOnly, async (request, reply) => {
    const { id } = parse(paramsSchema, request.params)

    const existing = await request.db.ingredient.findFirst({ where: { id } })
    if (!existing) throw notFound('Ingrediente')

    await request.db.ingredient.delete({ where: { id } })

    return reply.code(204).send()
  })
}
