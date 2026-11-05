import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireRole, requireTenant } from '../../lib/guards'
import { parse } from '../../lib/validation'
import { notFound } from '../../lib/errors'

const paramsSchema = z.object({ id: z.string().min(1) })

const listQuerySchema = z.object({
  isActive: z.enum(['true', 'false']).optional(),
})

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

const updateSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).max(100).optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Nada que actualizar')

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default async function categoriesRoutes(app: FastifyInstance): Promise<void> {
  const adminOnly = { preHandler: [app.authenticate, requireRole('ADMIN')] }

  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    requireTenant(request)
    const query = parse(listQuerySchema, request.query)
    const where = query.isActive ? { isActive: query.isActive === 'true' } : {}

    return {
      data: await request.db.category.findMany({
        where,
        include: { _count: { select: { dishes: true } } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    }
  })

  app.post('/', adminOnly, async (request, reply) => {
    const tenantId = requireTenant(request)
    const body = parse(createSchema, request.body)

    const category = await request.db.category.create({
      data: {
        tenantId,
        name: body.name,
        slug: body.slug ?? slugify(body.name),
        sortOrder: body.sortOrder,
        isActive: body.isActive,
      },
    })

    return reply.code(201).send({ data: category })
  })

  app.patch('/:id', adminOnly, async (request) => {
    const { id } = parse(paramsSchema, request.params)
    const body = parse(updateSchema, request.body)

    const existing = await request.db.category.findFirst({ where: { id } })
    if (!existing) throw notFound('Categoría')

    return { data: await request.db.category.update({ where: { id }, data: body }) }
  })

  // Borrado lógico: conserva el historial de platos y pedidos.
  app.delete('/:id', adminOnly, async (request) => {
    const { id } = parse(paramsSchema, request.params)

    const existing = await request.db.category.findFirst({ where: { id } })
    if (!existing) throw notFound('Categoría')

    return { data: await request.db.category.update({ where: { id }, data: { isActive: false } }) }
  })
}
