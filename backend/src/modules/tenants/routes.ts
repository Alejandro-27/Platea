import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { parse } from '../../lib/validation'
import { notFound } from '../../lib/errors'

const paramsSchema = z.object({ tenantId: z.string().min(1) })
const slugParamsSchema = z.object({ slug: z.string().min(1) })

export default async function tenantsRoutes(app: FastifyInstance): Promise<void> {
  // Resuelve un slug público al tenant (incluye su tenantId para construir la URL del menú).
  app.get('/:slug', async (request) => {
    const { slug } = parse(slugParamsSchema, request.params)

    const tenant = await prisma.tenant.findFirst({
      where: { slug, isActive: true },
      select: { id: true, name: true, slug: true, isActive: true, primaryColor: true },
    })

    if (!tenant) throw notFound('Restaurante')

    return { data: tenant }
  })

  // Menú público del comensal. El CRUD de tenants (Super Admin) sigue pendiente.
  app.get('/:tenantId/menu', async (request) => {
    const { tenantId } = parse(paramsSchema, request.params)

    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
      },
    })

    if (!tenant) throw notFound('Restaurante')

    const categories = await prisma.category.findMany({
      where: { tenantId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        sortOrder: true,
        dishes: {
          where: { isAvailable: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrl: true,
            isOutOfStock: true,
            isSpicy: true,
            isVegetarian: true,
            isGlutenFree: true,
            allergens: true,
            averageRating: true,
            reviewCount: true,
          },
        },
      },
    })

    return { data: { tenant, categories } }
  })
}
