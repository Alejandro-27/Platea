import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { UserRole } from '@prisma/client'
import { hashPassword } from '../../lib/password'
import { requireRole, requireTenant } from '../../lib/guards'
import { parse } from '../../lib/validation'
import { paginationMeta, paginationSchema } from '../../lib/pagination'
import { AppError, notFound } from '../../lib/errors'

const roleSchema = z.enum(['ADMIN', 'STAFF', 'KITCHEN'])

const listQuerySchema = paginationSchema.extend({
  role: roleSchema.optional(),
})

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: roleSchema.default('STAFF'),
})

const updateSchema = z
  .object({
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    role: roleSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Nada que actualizar')

const paramsSchema = z.object({ id: z.string().min(1) })

export default async function usersRoutes(app: FastifyInstance): Promise<void> {
  const adminOnly = { preHandler: [app.authenticate, requireRole('ADMIN')] }

  app.get('/', adminOnly, async (request) => {
    const query = parse(listQuerySchema, request.query)
    const where = query.role ? { role: query.role as UserRole } : {}

    const [users, total] = await Promise.all([
      request.db.user.findMany({
        where,
        select: { id: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      request.db.user.count({ where }),
    ])

    return { data: users, meta: paginationMeta(total, query.page, query.limit) }
  })

  app.post('/', adminOnly, async (request, reply) => {
    const tenantId = requireTenant(request)
    const body = parse(createSchema, request.body)
    const passwordHash = await hashPassword(body.password)

    const user = await request.db.user.create({
      data: { email: body.email, passwordHash, role: body.role, tenantId },
      select: { id: true, email: true, role: true, createdAt: true },
    })

    return reply.code(201).send({ data: user })
  })

  app.patch('/:id', adminOnly, async (request) => {
    const { id } = parse(paramsSchema, request.params)
    const body = parse(updateSchema, request.body)

    const existing = await request.db.user.findFirst({ where: { id } })
    if (!existing) throw notFound('Usuario')

    if (existing.id === request.user.sub && body.role && body.role !== 'ADMIN') {
      throw new AppError(403, 'FORBIDDEN', 'No puedes quitarte el rol ADMIN')
    }

    const data: { email?: string; passwordHash?: string; role?: UserRole } = {}
    if (body.email) data.email = body.email
    if (body.role) data.role = body.role
    if (body.password) data.passwordHash = await hashPassword(body.password)

    return {
      data: await request.db.user.update({
        where: { id },
        data,
        select: { id: true, email: true, role: true, createdAt: true },
      }),
    }
  })

  app.delete('/:id', adminOnly, async (request, reply) => {
    const { id } = parse(paramsSchema, request.params)

    if (id === request.user.sub) {
      throw new AppError(403, 'FORBIDDEN', 'No puedes eliminar tu propio usuario')
    }

    const existing = await request.db.user.findFirst({ where: { id } })
    if (!existing) throw notFound('Usuario')

    await request.db.user.delete({ where: { id } })

    return reply.code(204).send()
  })
}
