import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { hashPassword } from '../../lib/password'
import { requireRole } from '../../lib/guards'
import { parse } from '../../lib/validation'
import { paginationMeta, paginationSchema } from '../../lib/pagination'
import { notFound } from '../../lib/errors'

const slugSchema = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido')

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color hex inválido')

const listQuerySchema = paginationSchema.extend({
  search: z.string().min(1).optional(),
  isActive: z.enum(['true', 'false']).optional(),
})

const paramsSchema = z.object({ id: z.string().min(1) })

const createSchema = z.object({
  name: z.string().min(2).max(120),
  slug: slugSchema.optional(),
  logoUrl: z.string().url().nullable().optional(),
  primaryColor: colorSchema.default('#111827'),
  secondaryColor: colorSchema.nullable().optional(),
  subscriptionPlan: z.string().min(1).max(30).default('free'),
  isActive: z.boolean().default(true),
  // Sin esto el tenant no tendría ningún usuario con el que entrar.
  admin: z
    .object({
      email: z.string().email(),
      password: z.string().min(8),
    })
    .optional(),
})

const updateSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    slug: slugSchema.optional(),
    logoUrl: z.string().url().nullable().optional(),
    primaryColor: colorSchema.optional(),
    secondaryColor: colorSchema.nullable().optional(),
    subscriptionPlan: z.string().min(1).max(30).optional(),
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

const tenantInclude = {
  _count: { select: { users: true, tables: true, dishes: true, orders: true } },
} as const

export default async function superTenantRoutes(app: FastifyInstance): Promise<void> {
  const superOnly = { preHandler: [app.authenticate, requireRole('SUPER_ADMIN')] }

  app.get('/', superOnly, async (request) => {
    const query = parse(listQuerySchema, request.query)

    const where = {
      ...(query.isActive ? { isActive: query.isActive === 'true' } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { slug: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: tenantInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.tenant.count({ where }),
    ])

    return { data: tenants, meta: paginationMeta(total, query.page, query.limit) }
  })

  app.get('/:id', superOnly, async (request) => {
    const { id } = parse(paramsSchema, request.params)

    const tenant = await prisma.tenant.findUnique({ where: { id }, include: tenantInclude })
    if (!tenant) throw notFound('Restaurante')

    return { data: tenant }
  })

  app.post('/', superOnly, async (request, reply) => {
    const body = parse(createSchema, request.body)
    const { admin, ...data } = body

    const passwordHash = admin ? await hashPassword(admin.password) : null

    const tenant = await prisma.$transaction(async (tx) => {
      const created = await tx.tenant.create({
        data: { ...data, slug: data.slug ?? slugify(data.name) },
      })

      if (admin && passwordHash) {
        await tx.user.create({
          data: {
            email: admin.email,
            passwordHash,
            role: 'ADMIN',
            tenantId: created.id,
          },
        })
      }

      return tx.tenant.findUniqueOrThrow({ where: { id: created.id }, include: tenantInclude })
    })

    return reply.code(201).send({ data: tenant })
  })

  app.patch('/:id', superOnly, async (request) => {
    const { id } = parse(paramsSchema, request.params)
    const body = parse(updateSchema, request.body)

    const existing = await prisma.tenant.findUnique({ where: { id } })
    if (!existing) throw notFound('Restaurante')

    return { data: await prisma.tenant.update({ where: { id }, data: body }) }
  })

  // Borrado lógico: conserva pedidos, sesiones y usuarios históricos.
  app.delete('/:id', superOnly, async (request) => {
    const { id } = parse(paramsSchema, request.params)

    const existing = await prisma.tenant.findUnique({ where: { id } })
    if (!existing) throw notFound('Restaurante')

    return { data: await prisma.tenant.update({ where: { id }, data: { isActive: false } }) }
  })
}
