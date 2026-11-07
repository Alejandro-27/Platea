export type Locale = 'es' | 'en'

export interface PublicTenant {
  id: string
  name: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
}

export interface PublicDish {
  id: string
  name: string
  description: string | null
  price: string
  imageUrl: string | null
  isOutOfStock: boolean
  isSpicy: boolean
  isVegetarian: boolean
  isGlutenFree: boolean
  allergens: string[]
  averageRating: string
  reviewCount: number
}

export interface PublicCategory {
  id: string
  name: string
  slug: string
  sortOrder: number
  dishes: PublicDish[]
}

export interface PublicMenu {
  tenant: PublicTenant
  categories: PublicCategory[]
}

export interface Session {
  id: string
  tenantId: string
  tableId: string
  expiresAt: string
  table: { number: number }
}

export interface StoredSession {
  id: string
  tenantId: string
  tableId: string
  tableNumber: number
  expiresAt: string
}

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED'
export type OrderItemStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED'

export interface OrderItem {
  id: string
  dishId: string
  quantity: number
  notes: string | null
  price: string
  itemStatus: OrderItemStatus
  dish: { id: string; name: string }
}

export interface Order {
  id: string
  status: OrderStatus
  tableId: string | null
  sessionId: string
  tenantId: string
  total: string
  notes: string | null
  createdAt: string
  updatedAt: string
  table: { id: string; number: number } | null
  items: OrderItem[]
}

export interface CreateOrderInput {
  items: Array<{ dishId: string; quantity: number; notes?: string }>
  notes?: string
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
}

/* ---------- Staff ---------- */

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'KITCHEN'

export interface StaffUser {
  id: string
  email: string
  role: UserRole
  createdAt?: string
}

export interface StaffTenant {
  id: string
  name: string
  slug: string
}

export interface AuthSession {
  token: string
  user: StaffUser
  tenant: StaffTenant | null
}

export interface Category {
  id: string
  name: string
  slug: string
  sortOrder: number
  isActive: boolean
  _count?: { dishes: number }
}

export interface RecipeItem {
  ingredientId: string
  quantity: number
  ingredient?: { name: string; unit: string }
}

export interface AdminDish {
  id: string
  name: string
  description: string | null
  price: string
  imageUrl: string | null
  isAvailable: boolean
  isOutOfStock: boolean
  isSpicy: boolean
  isVegetarian: boolean
  isGlutenFree: boolean
  allergens: string[]
  sortOrder: number
  categoryId: string
  category: { id: string; name: string }
  dishIngredients: RecipeItem[]
}

export interface Ingredient {
  id: string
  name: string
  unit: string
  currentStock: string
  minStock: string
  costPerUnit: string | null
}

export interface TableInfo {
  id: string
  number: number
  qrCode: string
  isActive: boolean
}

export interface TableQr {
  tableId: string
  number: number
  qrCode: string
  url: string
}

export interface TenantSettings {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string | null
}

export interface DishInput {
  name: string
  description?: string | null
  price: number
  imageUrl?: string | null
  isAvailable?: boolean
  isOutOfStock?: boolean
  isSpicy?: boolean
  isVegetarian?: boolean
  isGlutenFree?: boolean
  allergens?: string[]
  sortOrder?: number
  categoryId: string
  ingredients?: Array<{ ingredientId: string; quantity: number }>
}

export interface IngredientInput {
  name: string
  unit: string
  currentStock?: number
  minStock?: number
  costPerUnit?: number | null
}

export interface UserInput {
  email: string
  password?: string
  role?: UserRole
}

export interface TenantSettingsInput {
  name?: string
  logoUrl?: string | null
  primaryColor?: string
  secondaryColor?: string | null
}
