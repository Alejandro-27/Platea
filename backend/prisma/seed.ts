import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/password'
import { generateQrCode } from '../src/lib/qr'

const prisma = new PrismaClient()

const DEMO_ADMIN_EMAIL = 'admin@demorestaurante.com'
const DEMO_ADMIN_PASSWORD = 'demo1234'

// Las credenciales existentes del MEMORY.md se mantienen intactas.
const PLATEA_ADMIN_EMAIL = 'admin@platea.local'
const PLATEA_ADMIN_PASSWORD = 'admin1234'
const SUPER_ADMIN_EMAIL = 'super@platea.local'
const SUPER_ADMIN_PASSWORD = 'super1234'

async function main(): Promise<void> {
  /*──────────────────────────────────────────────────────────────
   1. Tenant de demostración: Trattoria Bella Roma
   ─────────────────────────────────────────────────────────────*/
  const bellaRoma = await prisma.tenant.upsert({
    where: { slug: 'bella-roma' },
    update: {},
    create: {
      name: 'Trattoria Bella Roma',
      slug: 'bella-roma',
      logoUrl: null,
      primaryColor: '#059669',
      secondaryColor: null,
      subscriptionPlan: 'free',
      isActive: true,
    },
  })

  // Mantener el tenant demo original para no romper credenciales documentadas.
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Restaurante Demo',
      slug: 'demo',
      primaryColor: '#0f766e',
    },
  })

  /*──────────────────────────────────────────────────────────────
   2. Usuarios
   ─────────────────────────────────────────────────────────────*/
  const demoAdminHash = await hashPassword(DEMO_ADMIN_PASSWORD)
  const plateaAdminHash = await hashPassword(PLATEA_ADMIN_PASSWORD)
  const superAdminHash = await hashPassword(SUPER_ADMIN_PASSWORD)

  await prisma.user.upsert({
    where: { email: DEMO_ADMIN_EMAIL },
    update: { tenantId: bellaRoma.id, role: 'ADMIN' },
    create: {
      email: DEMO_ADMIN_EMAIL,
      passwordHash: demoAdminHash,
      role: 'ADMIN',
      tenantId: bellaRoma.id,
    },
  })

  await prisma.user.upsert({
    where: { email: PLATEA_ADMIN_EMAIL },
    update: { tenantId: demoTenant.id, role: 'ADMIN' },
    create: {
      email: PLATEA_ADMIN_EMAIL,
      passwordHash: plateaAdminHash,
      role: 'ADMIN',
      tenantId: demoTenant.id,
    },
  })

  await prisma.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    update: { role: 'SUPER_ADMIN', tenantId: null },
    create: {
      email: SUPER_ADMIN_EMAIL,
      passwordHash: superAdminHash,
      role: 'SUPER_ADMIN',
      tenantId: null,
    },
  })

  /*──────────────────────────────────────────────────────────────
   3. Mesas (6) para Bella Roma
   ─────────────────────────────────────────────────────────────*/
  const tables: { id: string; number: number }[] = []
  for (let i = 1; i <= 6; i++) {
    const table = await prisma.table.upsert({
      where: { tenantId_number: { tenantId: bellaRoma.id, number: i } },
      update: {},
      create: { tenantId: bellaRoma.id, number: i, qrCode: generateQrCode(), isActive: true },
    })
    tables.push(table)
  }

  /*──────────────────────────────────────────────────────────────
   4. Categorías
   ─────────────────────────────────────────────────────────────*/
  const categoryNames = [
    { name: 'Entradas', slug: 'entradas', sortOrder: 1 },
    { name: 'Principales', slug: 'principales', sortOrder: 2 },
    { name: 'Postres', slug: 'postres', sortOrder: 3 },
    { name: 'Bebidas', slug: 'bebidas', sortOrder: 4 },
  ]
  const categories: { id: string; name: string }[] = []
  for (const cat of categoryNames) {
    const category = await prisma.category.upsert({
      where: { tenantId_slug: { tenantId: bellaRoma.id, slug: cat.slug } },
      update: {},
      create: { tenantId: bellaRoma.id, ...cat },
    })
    categories.push(category)
  }

  const [entradas, principales, postres, bebidas] = categories

  /*──────────────────────────────────────────────────────────────
   5. Ingredientes (8)
   ─────────────────────────────────────────────────────────────*/
  const ingredientData = [
    { name: 'Tomate', unit: 'kg', currentStock: 2, minStock: 5, costPerUnit: 3.5 }, // bajo
    { name: 'Queso mozzarella', unit: 'kg', currentStock: 8, minStock: 4, costPerUnit: 12.0 },
    { name: 'Pan', unit: 'unidad', currentStock: 30, minStock: 10, costPerUnit: 1.0 },
    { name: 'Carne de res', unit: 'kg', currentStock: 1, minStock: 3, costPerUnit: 18.0 }, // bajo
    { name: 'Lechuga', unit: 'unidad', currentStock: 12, minStock: 6, costPerUnit: 2.0 },
    { name: 'Aceite de oliva', unit: 'litro', currentStock: 20, minStock: 5, costPerUnit: 9.0 },
    { name: 'Harina de trigo', unit: 'kg', currentStock: 15, minStock: 8, costPerUnit: 2.5 },
    { name: 'Huevos', unit: 'unidad', currentStock: 60, minStock: 24, costPerUnit: 0.4 },
  ]
  const ingredients: { id: string; name: string }[] = []
  for (const ing of ingredientData) {
    let ingredient = await prisma.ingredient.findFirst({
      where: { tenantId: bellaRoma.id, name: ing.name },
    })
    if (!ingredient) {
      ingredient = await prisma.ingredient.create({
        data: { tenantId: bellaRoma.id, ...ing },
      })
    }
    ingredients.push(ingredient)
  }

  const [tomate, queso, pan, carne, aceite, harina, huevos] = ingredients

  /*──────────────────────────────────────────────────────────────
   6. Platos (12, 3 por categoría)
   ─────────────────────────────────────────────────────────────*/
  const dishData = [
    // Entradas
    {
      name: 'Bruschetta al tomate',
      description: 'Pan tostado con tomate, ajo, albahaca y aceite de oliva virgen extra.',
      price: 6.5,
      category: entradas,
      imageUrl: 'https://images.unsplash.com/photo-1572758665677-ed42245c7ba5?w=400',
      isVegetarian: true,
      isSpicy: false,
      isGlutenFree: false,
      allergens: ['gluten'],
      averageRating: 4.2,
      reviewCount: 24,
      outOfStock: false,
    },
    {
      name: 'Carpaccio de res',
      description: 'Láminas finas de carne de res con rúcula, parmesano y limón.',
      price: 12.0,
      category: entradas,
      imageUrl: 'https://images.unsplash.com/photo-1544035201-77277e9873c7?w=400',
      isVegetarian: false,
      isSpicy: false,
      isGlutenFree: true,
      allergens: ['lácteos'],
      averageRating: 4.5,
      reviewCount: 18,
      outOfStock: false,
    },
    {
      name: 'Ensalada caprese',
      description: 'Tomate, mozzarella de búfala, albahaca y glaseado de balsámico.',
      price: 8.5,
      category: entradas,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
      isVegetarian: true,
      isSpicy: false,
      isGlutenFree: true,
      allergens: ['lácteos'],
      averageRating: 4.0,
      reviewCount: 31,
      outOfStock: true, // agotado para probar el estado
    },
    // Principales
    {
      name: 'Spaghetti carbonara',
      description: 'Pasta con huevo, queso pecorino, panceta y pimienta negra.',
      price: 14.0,
      category: principales,
      imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221838e3?w=400',
      isVegetarian: false,
      isSpicy: false,
      isGlutenFree: false,
      allergens: ['gluten', 'huevos', 'lácteos'],
      averageRating: 4.7,
      reviewCount: 42,
      outOfStock: false,
    },
    {
      name: 'Risotto de hongos',
      description: 'Arborio con hongos silvestres, vino blanco y queso parmesano.',
      price: 15.5,
      category: principales,
      imageUrl: 'https://images.unsplash.com/photo-1472803181377-7db09b79aa2b?w=400',
      isVegetarian: true,
      isSpicy: false,
      isGlutenFree: true,
      allergens: ['lácteos'],
      averageRating: 4.4,
      reviewCount: 27,
      outOfStock: false,
    },
    {
      name: 'Bistec a la fiorentina',
      description: 'Corte de carne de res a la brasa con hierbas finas y papas al horno.',
      price: 24.0,
      category: principales,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f580a698c7?w=400',
      isVegetarian: false,
      isSpicy: true,
      isGlutenFree: true,
      allergens: [],
      averageRating: 4.8,
      reviewCount: 39,
      outOfStock: false,
    },
    // Postres
    {
      name: 'Tiramisú clásico',
      description: 'Capas de bizcocho, café, mascarpone y cacao en polvo.',
      price: 7.0,
      category: postres,
      imageUrl: 'https://images.unsplash.com/photo-1572480217171-7d7b3e98a791?w=400',
      isVegetarian: true,
      isSpicy: false,
      isGlutenFree: false,
      allergens: ['gluten', 'huevos', 'lácteos', 'frutos secos'],
      averageRating: 4.6,
      reviewCount: 48,
      outOfStock: false,
    },
    {
      name: 'Panna cotta de frutos rojos',
      description: 'Crema cocida con salsa de frutos del bosque.',
      price: 6.0,
      category: postres,
      imageUrl: 'https://images.unsplash.com/photo-1488446048161-251e64cc575e?w=400',
      isVegetarian: true,
      isSpicy: false,
      isGlutenFree: true,
      allergens: ['lácteos'],
      averageRating: 4.1,
      reviewCount: 22,
      outOfStock: false,
    },
    {
      name: 'Gelato artesanal',
      description: 'Helado italiano de sabores variados (frutilla, chocolate, pistacho).',
      price: 5.0,
      category: postres,
      imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400',
      isVegetarian: true,
      isSpicy: false,
      isGlutenFree: true,
      allergens: ['lácteos'],
      averageRating: 4.3,
      reviewCount: 35,
      outOfStock: false,
    },
    // Bebidas
    {
      name: 'Agua mineral',
      description: 'Botella de agua mineral con gas o sin gas.',
      price: 3.0,
      category: bebidas,
      imageUrl: 'https://images.unsplash.com/photo-1547972310-fb299589bee8?w=400',
      isVegetarian: true,
      isSpicy: false,
      isGlutenFree: true,
      allergens: [],
      averageRating: 3.8,
      reviewCount: 12,
      outOfStock: false,
    },
    {
      name: 'Vino tinto Casa',
      description: 'Copa de vino tinto de la región de Toscana.',
      price: 9.0,
      category: bebidas,
      imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400',
      isVegetarian: true,
      isSpicy: false,
      isGlutenFree: true,
      allergens: [],
      averageRating: 4.0,
      reviewCount: 19,
      outOfStock: false,
    },
    {
      name: 'Espresso italiano',
      description: 'Café espresso intenso, servido en taza pequeña.',
      price: 2.5,
      category: bebidas,
      imageUrl: 'https://images.unsplash.com/photo-1510709520080-0567f6423009?w=400',
      isVegetarian: true,
      isSpicy: false,
      isGlutenFree: true,
      allergens: [],
      averageRating: 4.2,
      reviewCount: 41,
      outOfStock: false,
    },
  ]

  const dishes: { id: string; name: string; categoryId: string }[] = []
  for (const d of dishData) {
    let dish = await prisma.dish.findFirst({
      where: { tenantId: bellaRoma.id, name: d.name },
    })
    if (!dish) {
      dish = await prisma.dish.create({
        data: {
          tenantId: bellaRoma.id,
          categoryId: d.category.id,
          name: d.name,
          description: d.description,
          price: d.price,
          imageUrl: d.imageUrl,
          isAvailable: true,
          isOutOfStock: d.outOfStock,
          isSpicy: d.isSpicy,
          isVegetarian: d.isVegetarian,
          isGlutenFree: d.isGlutenFree,
          allergens: d.allergens,
          averageRating: d.averageRating,
          reviewCount: d.reviewCount,
          sortOrder: dishes.length + 1,
        },
      })
    }
    dishes.push(dish)
  }

  /*──────────────────────────────────────────────────────────────
   7. DishIngredient (recetas para al menos 6 platos)
   ─────────────────────────────────────────────────────────────*/
  const recipes: [string, string, number][] = [
    // Bruschetta al tomate -> pan, tomate, aceite, ajo(usamos tomate como base)
    [dishes[0].id, pan.id, 2],
    [dishes[0].id, tomate.id, 0.15],
    [dishes[0].id, aceite.id, 0.05],
    // Carpaccio de res -> carne
    [dishes[1].id, carne.id, 0.15],
    [dishes[1].id, queso.id, 0.05],
    // Ensalada caprese -> tomate, queso, aceite
    [dishes[2].id, tomate.id, 0.2],
    [dishes[2].id, queso.id, 0.1],
    [dishes[2].id, aceite.id, 0.03],
    // Spaghetti carbonara -> harina, huevos, carne (panceta), queso
    [dishes[3].id, harina.id, 0.1],
    [dishes[3].id, huevos.id, 1],
    [dishes[3].id, carne.id, 0.08],
    [dishes[3].id, queso.id, 0.05],
    // Risotto de hongos -> harina (arroz approximated)
    [dishes[4].id, harina.id, 0.2],
    [dishes[4].id, queso.id, 0.05],
    [dishes[4].id, aceite.id, 0.05],
    // Bistec a la fiorentina -> carne
    [dishes[5].id, carne.id, 0.3],
    [dishes[5].id, aceite.id, 0.02],
  ]

  for (const [dishId, ingredientId, quantity] of recipes) {
    await prisma.dishIngredient.upsert({
      where: { dishId_ingredientId: { dishId, ingredientId } },
      update: { quantity },
      create: { dishId, ingredientId, quantity },
    })
  }

  /*──────────────────────────────────────────────────────────────
   8. Reviews (15+)
   ─────────────────────────────────────────────────────────────*/
  const reviewCommentsEs = [
    'Delicioso, volveré seguro.',
    'Muy buen sabor y presentación.',
    'El servicio fue excelente.',
    'Me encantó, lo recomiendo.',
    'Buena relación calidad-precio.',
  ]
  const reviewCommentsEn = [
    'Delicious, I will be back.',
    'Great taste and presentation.',
    'Excellent service.',
    'Loved it, I recommend it.',
    'Good value for money.',
  ]
  const allComments = [...reviewCommentsEs, ...reviewCommentsEn]

  for (let i = 0; i < 18; i++) {
    const dish = dishes[i % dishes.length]
    const rating = 3 + (i % 3) // 3, 4, 5 rotando
    await prisma.review.create({
      data: {
        tenantId: bellaRoma.id,
        dishId: dish.id,
        rating,
        comment: allComments[i % allComments.length],
        sessionId: null,
      },
    })
  }

  // Actualizar averageRating y reviewCount de los platos con reseñas
  for (const dish of dishes) {
    const reviews = await prisma.review.findMany({
      where: { dishId: dish.id },
    })
    if (reviews.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      await prisma.dish.update({
        where: { id: dish.id },
        data: {
          averageRating: Math.round(avg * 100) / 100,
          reviewCount: reviews.length,
        },
      })
    }
  }

  /*──────────────────────────────────────────────────────────────
   9. Sessions + Orders (para que KDS y admin tengan datos)
   ─────────────────────────────────────────────────────────────*/
  const ordersData = [
    {
      table: tables[0],
      status: 'PENDING' as const,
      items: [
        { dish: dishes[3], quantity: 2, notes: '', itemStatus: 'PENDING' as const },
        { dish: dishes[9], quantity: 1, notes: '', itemStatus: 'PENDING' as const },
      ],
    },
    {
      table: tables[1],
      status: 'PREPARING' as const,
      items: [
        { dish: dishes[0], quantity: 1, notes: 'sin ajo', itemStatus: 'PREPARING' as const },
        { dish: dishes[3], quantity: 1, notes: '', itemStatus: 'PENDING' as const },
      ],
    },
    {
      table: tables[2],
      status: 'READY' as const,
      items: [{ dish: dishes[6], quantity: 1, notes: '', itemStatus: 'READY' as const }],
    },
    {
      table: tables[3],
      status: 'SERVED' as const,
      items: [
        { dish: dishes[7], quantity: 2, notes: '', itemStatus: 'SERVED' as const },
        { dish: dishes[8], quantity: 1, notes: 'sin gas', itemStatus: 'SERVED' as const },
      ],
    },
  ]

  for (const orderData of ordersData) {
    const session = await prisma.session.create({
      data: {
        tenantId: bellaRoma.id,
        tableId: orderData.table.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    let total = 0
    const orderItems: {
      dishId: string
      quantity: number
      notes?: string
      itemStatus: string
      price: number
    }[] = []
    for (const item of orderData.items) {
      const dish = await prisma.dish.findUnique({ where: { id: item.dish.id } })
      const price = Number(dish?.price ?? item.dish.price)
      total += price * item.quantity
      orderItems.push({
        dishId: item.dish.id,
        quantity: item.quantity,
        notes: item.notes || undefined,
        itemStatus: item.itemStatus,
        price,
      })
    }

    await prisma.order.create({
      data: {
        tenantId: bellaRoma.id,
        tableId: orderData.table.id,
        sessionId: session.id,
        status: orderData.status,
        total,
        items: {
          create: orderItems,
        },
      },
    })
  }

  console.log(`Seed completado para Trattoria Bella Roma (${bellaRoma.slug})`)
  console.log(`  Admin: ${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD}`)
  console.log(`  Mesas: ${tables.length}`)
  console.log(`  Categorías: ${categories.length}`)
  console.log(`  Platos: ${dishes.length}`)
  console.log(`  Ingredientes: ${ingredients.length}`)
  console.log(`  Pedidos: ${ordersData.length}`)
  console.log(`  Credenciales Platea Demo: ${PLATEA_ADMIN_EMAIL} / ${PLATEA_ADMIN_PASSWORD}`)
  console.log(`  Super Admin: ${SUPER_ADMIN_EMAIL} / ${SUPER_ADMIN_PASSWORD}`)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    void prisma.$disconnect()
  })
