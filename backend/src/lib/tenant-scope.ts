/**
 * Modelos con columna tenantId propia.
 * - Tenant queda exento: es la entidad raíz (lookup público por id/slug).
 * - OrderItem y DishIngredient heredan el tenant a través de Order/Dish.
 */
export const TENANT_MODELS = new Set([
  'User',
  'Table',
  'Session',
  'Category',
  'Dish',
  'Ingredient',
  'Review',
  'Order',
])

// Escrituras por id también llevan tenantId en el where: Prisma 6 permite
// campos no únicos junto a la clave única (extendedWhereUnique).
const SCOPED_OPS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
])

const CREATE_OPS = new Set(['create', 'createMany', 'createManyAndReturn'])

export type PrismaArgs = Record<string, unknown>

/**
 * Devuelve una copia de los args acotada al tenant:
 * - lecturas/escrituras: inyecta `tenantId` en `where`
 * - creaciones: fuerza `tenantId` en `data` (ignora el valor del cliente)
 *
 * No procesa relaciones anidadas (decisión de alcance): un create anidado de
 * un modelo con tenantId debe enviar `tenantId` explícito o fallará por NOT NULL.
 */
export function applyTenantScope(
  model: string,
  operation: string,
  args: PrismaArgs,
  tenantId: string
): PrismaArgs {
  if (!TENANT_MODELS.has(model)) return args

  const scoped = { ...args }

  if (SCOPED_OPS.has(operation)) {
    scoped.where = {
      ...((scoped.where as PrismaArgs | undefined) ?? {}),
      tenantId,
    }
  }

  if (CREATE_OPS.has(operation)) {
    if (Array.isArray(scoped.data)) {
      scoped.data = scoped.data.map((row) => ({ ...(row as PrismaArgs), tenantId }))
    } else {
      scoped.data = { ...(scoped.data as PrismaArgs), tenantId }
    }
  }

  if (operation === 'upsert') {
    scoped.create = { ...(scoped.create as PrismaArgs), tenantId }
  }

  return scoped
}
