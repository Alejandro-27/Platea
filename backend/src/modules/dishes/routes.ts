import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Prisma, PrismaClient } from '@prisma/client'
import { requireRole, requireTenant } from '../../lib/guards'
import { parse } from '../../lib/validation'
import { paginationMeta, paginationSchema } from '../../lib/pagination'
import { AppError, notFound } from '../../lib/errors'

const paramsSchema = z.object({ id: z.string().min(1) })

const listQuerySchema = paginationSchema.extend({
  categoryId: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
  isAvailable: z.enum(['true', 'false']).optional(),
})

const recipeItemSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.number().positive(),
})

const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().positive().max(99_999_999.99),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean().default(true),
  isOutOfStock: z.boolean().default(false),
  isSpicy: z.boolean().default(false),
  isVegetarian: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  allergens: z.array(z.string().min(1)).max(20).default([]),
  sortOrder: z.number().int().default(0),
  categoryId: z.string().min(1),
  ingredients: z.array(recipeItemSchema).default([]),
})

const updateSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(1000).nullable().optional(),
    price: z.coerce.number().positive().max(99_999_999.99).optional(),
    imageUrl: z.string().url().nullable().optional(),
    isAvailable: z.boolean().optional(),
    isOutOfStock: z.boolean().optional(),
    isSpicy: z.boolean().optional(),
    isVegetarian: z.boolean().optional(),
    isGlutenFree: z.boolean().optional(),
    allergens: z.array(z.string().min(1)).max(20).optional(),
    sortOrder: z.number().int().optional(),
    categoryId: z.string().min(1).optional(),
    ingredients: z.array(recipeItemSchema).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Nada que actualizar')

type RecipeItem = z.infer<typeof recipeItemSchema>

const dishInclude = {
  category: { select: { id: true, name: true } },
  dishIngredients: {
    select: {
      ingredientId: true,
      quantity: true,
      ingredient: { select: { name: true, unit: true } },
    },
  },
} satisfies Prisma.DishInclude

async function assertCategory(db: PrismaClient, categoryId: string): Promise<void> {
  const category = await db.category.findFirst({ where: { id: categoryId } })
  if (!category) throw notFound('Categoría')
}

async function assertIngredients(db: PrismaClient, items: RecipeItem[]): Promise<void> {
  const ids = [...new Set(items.map((item) => item.ingredientId))]
  if (ids.length === 0) return

  const found = await db.ingredient.findMany({ where: { id: { in: ids } }, select: { id: true } })
  if (found.length !== ids.length) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Uno o más ingredientes no existen en el restaurante')
  }
}

export default async function dishesRoutes(app: FastifyInstance): Promise<void> {
  const adminOnly = { preHandler: [app.authenticate, requireRole('ADMIN')] }

  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    const query = parse(listQuerySchema, request.query)

    const where: Prisma.DishWhereInput = {}
    if (query.categoryId) where.categoryId = query.categoryId
    if (query.isAvailable) where.isAvailable = query.isAvailable === 'true'
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' }

    const [dishes, total] = await Promise.all([
      request.db.dish.findMany({
        where,
        include: dishInclude,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      request.db.dish.count({ where }),
    ])

    return { data: dishes, meta: paginationMeta(total, query.page, query.limit) }
  })

  app.get('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = parse(paramsSchema, request.params)

    const dish = await request.db.dish.findFirst({ where: { id }, include: dishInclude })
    if (!dish) throw notFound('Plato')

    return { data: dish }
  })

  app.post('/', adminOnly, async (request, reply) => {
    const tenantId = requireTenant(request)
    const body = parse(createSchema, request.body)

    await assertCategory(request.db, body.categoryId)
    await assertIngredients(request.db, body.ingredients)

    const { ingredients, ...data } = body
    const dish = await request.db.dish.create({
      data: {
        ...data,
        tenantId,
        dishIngredients: {
          create: ingredients.map((item) => ({
            ingredientId: item.ingredientId,
            quantity: item.quantity,
          })),
        },
      },
      include: dishInclude,
    })

    return reply.code(201).send({ data: dish })
  })

  app.patch('/:id', adminOnly, async (request) => {
    const tenantId = requireTenant(request)
    const { id } = parse(paramsSchema, request.params)
    const body = parse(updateSchema, request.body)

    const existing = await request.db.dish.findFirst({ where: { id } })
    if (!existing) throw notFound('Plato')

    if (body.categoryId) await assertCategory(request.db, body.categoryId)
    if (body.ingredients) await assertIngredients(request.db, body.ingredients)

    const { ingredients, ...data } = body

    const dish = await request.db.$transaction(async (tx) => {
      if (ingredients) {
        await tx.dishIngredient.deleteMany({ where: { dishId: id } })
        if (ingredients.length > 0) {
          await tx.dishIngredient.createMany({
            data: ingredients.map((item) => ({
              dishId: id,
              ingredientId: item.ingredientId,
              quantity: item.quantity,
            })),
          })
        }
      }

      return tx.dish.update({
        where: { id, tenantId },
        data,
        include: dishInclude,
      })
    })

    return { data: dish }
  })

  // Borrado lógico: conserva pedidos históricos que referencian el plato.
  app.delete('/:id', adminOnly, async (request) => {
    const tenantId = requireTenant(request)
    const { id } = parse(paramsSchema, request.params)

    const existing = await request.db.dish.findFirst({ where: { id } })
    if (!existing) throw notFound('Plato')

    const dish = await request.db.dish.update({
      where: { id, tenantId },
      data: { isAvailable: false, isOutOfStock: true },
      include: dishInclude,
    })

    return { data: dish }
  })
}
