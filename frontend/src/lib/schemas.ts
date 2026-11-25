import { z } from 'zod'

// Los mensajes son claves de i18n: el formulario los traduce al mostrarlos.
const name = z.string().trim().min(1, 'validation.name').max(100, 'validation.name')
const role = z.enum(['ADMIN', 'STAFF', 'KITCHEN'])

export const categorySchema = z.object({
  name,
  sortOrder: z.number().int('validation.number'),
})

export const tableSchema = z.object({
  number: z.number().int('validation.tableNumber').positive('validation.tableNumber'),
})

export const ingredientSchema = z.object({
  name,
  unit: z.string().trim().min(1, 'validation.unit').max(20, 'validation.unit'),
  currentStock: z.number().min(0, 'validation.stock'),
  minStock: z.number().min(0, 'validation.stock'),
  costPerUnit: z.number().min(0, 'validation.cost').nullable(),
})

export const userSchema = z.object({
  email: z.email('validation.email'),
  password: z.string().min(8, 'validation.password'),
  role,
})

export const userUpdateSchema = z.object({
  email: z.email('validation.email'),
  password: z.string().min(8, 'validation.password').optional(),
  role,
})

export const dishSchema = z.object({
  name: z.string().trim().min(1, 'validation.name').max(120, 'validation.name'),
  price: z.number().positive('validation.price'),
  imageUrl: z.url('validation.url').nullable(),
  categoryId: z.string().min(1, 'validation.category'),
  sortOrder: z.number().int('validation.number'),
  allergens: z.array(z.string().min(1)).max(20, 'validation.allergens'),
  recipe: z.array(
    z.object({
      ingredientId: z.string().min(1),
      quantity: z.number().positive('validation.quantity'),
    })
  ),
})

export const settingsSchema = z.object({
  name: z.string().trim().min(2, 'validation.name').max(120, 'validation.name'),
  logoUrl: z.url('validation.url').nullable(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'validation.color'),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'validation.color')
    .nullable(),
})

/** Devuelve la clave i18n del primer error o null si el valor es válido. */
export function validate(schema: z.ZodType, value: unknown): string | null {
  const result = schema.safeParse(value)
  return result.success ? null : (result.error.issues[0]?.message ?? 'staff.error')
}
