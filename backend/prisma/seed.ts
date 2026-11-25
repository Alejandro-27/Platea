import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/password'
import { generateQrCode } from '../src/lib/qr'

const prisma = new PrismaClient()

const ADMIN_EMAIL = 'admin@platea.local'
const ADMIN_PASSWORD = 'admin1234'
const SUPER_ADMIN_EMAIL = 'super@platea.local'
const SUPER_ADMIN_PASSWORD = 'super1234'

async function main(): Promise<void> {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Restaurante Demo',
      slug: 'demo',
      primaryColor: '#0f766e',
    },
  })

  const passwordHash = await hashPassword(ADMIN_PASSWORD)

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { tenantId: tenant.id, role: 'ADMIN' },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  })

  await prisma.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    update: { role: 'SUPER_ADMIN', tenantId: null },
    create: {
      email: SUPER_ADMIN_EMAIL,
      passwordHash: await hashPassword(SUPER_ADMIN_PASSWORD),
      role: 'SUPER_ADMIN',
      tenantId: null,
    },
  })

  for (const number of [1, 2]) {
    await prisma.table.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number } },
      update: {},
      create: { tenantId: tenant.id, number, qrCode: generateQrCode() },
    })
  }

  const category = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'principales' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Principales',
      slug: 'principales',
      sortOrder: 1,
    },
  })

  let ingredient = await prisma.ingredient.findFirst({
    where: { tenantId: tenant.id, name: 'Pan de burger' },
  })

  if (!ingredient) {
    ingredient = await prisma.ingredient.create({
      data: {
        tenantId: tenant.id,
        name: 'Pan de burger',
        unit: 'unidad',
        currentStock: 50,
        minStock: 10,
      },
    })
  }

  const dishes = [
    { name: 'Burger clásica', price: 9.9, description: 'Carne, queso y lechuga' },
    {
      name: 'Ensalada vegetariana',
      price: 7.5,
      description: 'Verduras de temporada',
      isVegetarian: true,
    },
  ]

  for (const dish of dishes) {
    const existing = await prisma.dish.findFirst({
      where: { tenantId: tenant.id, name: dish.name },
    })

    if (!existing) {
      await prisma.dish.create({
        data: {
          tenantId: tenant.id,
          categoryId: category.id,
          allergens: [],
          ...dish,
        },
      })
    }
  }

  const burger = await prisma.dish.findFirst({
    where: { tenantId: tenant.id, name: 'Burger clásica' },
  })

  if (burger) {
    await prisma.dishIngredient.upsert({
      where: { dishId_ingredientId: { dishId: burger.id, ingredientId: ingredient.id } },
      update: { quantity: 1 },
      create: { dishId: burger.id, ingredientId: ingredient.id, quantity: 1 },
    })
  }

  console.log(`Seed OK:`)
  console.log(`  Admin tenant: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD} (tenant ${tenant.slug})`)
  console.log(`  Super Admin:  ${SUPER_ADMIN_EMAIL} / ${SUPER_ADMIN_PASSWORD}`)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    void prisma.$disconnect()
  })
