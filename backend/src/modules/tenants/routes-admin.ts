import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireRole, requireTenant } from '../../lib/guards'
import { parse } from '../../lib/validation'
import { notFound } from '../../lib/errors'

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color hex inválido')

const updateSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    logoUrl: z.string().url().nullable().optional(),
    primaryColor: colorSchema.optional(),
    secondaryColor: colorSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Nada que actualizar')

const select = {
  id: true,
  name: true,
  slug: true,
  logoUrl: true,
  primaryColor: true,
  secondaryColor: true,
} as const

/** Ajustes del propio restaurante (el Super Admin gestiona tenants desde /api/tenants). */
export default async function adminTenantRoutes(app: FastifyInstance): Promise<void> {
  const adminOnly = { preHandler: [app.authenticate, requireRole('ADMIN')] }

  app.get('/', adminOnly, async (request) => {
    const tenantId = requireTenant(request)

    // Tenant es la entidad raíz: el aislamiento no lo filtra, se acota por id.
    const tenant = await request.db.tenant.findUnique({ where: { id: tenantId }, select })
    if (!tenant) throw notFound('Restaurante')

    return { data: tenant }
  })

  app.patch('/', adminOnly, async (request) => {
    const tenantId = requireTenant(request)
    const body = parse(updateSchema, request.body)

    const existing = await request.db.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    })
    if (!existing) throw notFound('Restaurante')

    return { data: await request.db.tenant.update({ where: { id: tenantId }, data: body, select }) }
  })
}
