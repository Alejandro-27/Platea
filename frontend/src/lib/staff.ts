import { API_URL, ApiError, apiRequest, type ApiEnvelope } from './api'
import { useAuth } from '@/store/auth'
import type {
  AdminDish,
  Category,
  DishInput,
  Ingredient,
  IngredientInput,
  Order,
  TableInfo,
  TableQr,
  TenantSettings,
  TenantSettingsInput,
  UserInput,
  StaffUser,
} from '@/types/api'

function authToken(): string {
  const token = useAuth.getState().token
  if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'No autenticado')
  return token
}

interface StaffOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
}

async function staffRequest<T>(path: string, options: StaffOptions = {}): Promise<ApiEnvelope<T>> {
  try {
    return await apiRequest<T>(path, { ...options, token: authToken() })
  } catch (error) {
    // Un token caducado cierra la sesión para volver a /login.
    if (error instanceof ApiError && error.status === 401) useAuth.getState().logout()
    throw error
  }
}

const query = (params: Record<string, string | number | undefined>): string => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

/* ---------- Pedidos ---------- */

export async function listOrders(
  params: { status?: string; limit?: number } = {}
): Promise<Order[]> {
  const { data } = await staffRequest<Order[]>(`/api/orders${query(params)}`)
  return data
}

export async function updateOrderStatus(id: string, status: string): Promise<Order> {
  const { data } = await staffRequest<Order>(`/api/orders/${id}/status`, {
    method: 'PATCH',
    body: { status },
  })
  return data
}

export async function updateItemStatus(
  orderId: string,
  itemId: string,
  status: string
): Promise<Order> {
  const { data } = await staffRequest<Order>(`/api/orders/${orderId}/items/${itemId}/status`, {
    method: 'PATCH',
    body: { status },
  })
  return data
}

/* ---------- Categorías ---------- */

export async function listCategories(): Promise<Category[]> {
  const { data } = await staffRequest<Category[]>('/api/categories')
  return data
}

export async function createCategory(input: {
  name: string
  sortOrder?: number
  isActive?: boolean
}): Promise<Category> {
  const { data } = await staffRequest<Category>('/api/categories', { method: 'POST', body: input })
  return data
}

export async function updateCategory(
  id: string,
  input: Partial<{ name: string; sortOrder: number; isActive: boolean }>
): Promise<Category> {
  const { data } = await staffRequest<Category>(`/api/categories/${id}`, {
    method: 'PATCH',
    body: input,
  })
  return data
}

export async function deleteCategory(id: string): Promise<void> {
  await staffRequest<Category>(`/api/categories/${id}`, { method: 'DELETE' })
}

/* ---------- Platos ---------- */

export async function listDishes(
  params: { categoryId?: string; search?: string } = {}
): Promise<AdminDish[]> {
  const { data } = await staffRequest<AdminDish[]>(`/api/dishes${query({ ...params, limit: 100 })}`)
  return data
}

export async function createDish(input: DishInput): Promise<AdminDish> {
  const { data } = await staffRequest<AdminDish>('/api/dishes', { method: 'POST', body: input })
  return data
}

export async function updateDish(id: string, input: Partial<DishInput>): Promise<AdminDish> {
  const { data } = await staffRequest<AdminDish>(`/api/dishes/${id}`, {
    method: 'PATCH',
    body: input,
  })
  return data
}

export async function deleteDish(id: string): Promise<void> {
  await staffRequest<AdminDish>(`/api/dishes/${id}`, { method: 'DELETE' })
}

/* ---------- Ingredientes ---------- */

export async function listIngredients(params: { search?: string } = {}): Promise<Ingredient[]> {
  const { data } = await staffRequest<Ingredient[]>(
    `/api/ingredients${query({ ...params, limit: 100 })}`
  )
  return data
}

export async function createIngredient(input: IngredientInput): Promise<Ingredient> {
  const { data } = await staffRequest<Ingredient>('/api/ingredients', {
    method: 'POST',
    body: input,
  })
  return data
}

export async function updateIngredient(
  id: string,
  input: Partial<IngredientInput>
): Promise<Ingredient> {
  const { data } = await staffRequest<Ingredient>(`/api/ingredients/${id}`, {
    method: 'PATCH',
    body: input,
  })
  return data
}

export async function deleteIngredient(id: string): Promise<void> {
  await staffRequest<Ingredient>(`/api/ingredients/${id}`, { method: 'DELETE' })
}

/* ---------- Mesas ---------- */

export async function listTables(): Promise<TableInfo[]> {
  const { data } = await staffRequest<TableInfo[]>('/api/tables?limit=100')
  return data
}

export async function createTable(number: number, isActive = true): Promise<TableInfo> {
  const { data } = await staffRequest<TableInfo>('/api/tables', {
    method: 'POST',
    body: { number, isActive },
  })
  return data
}

export async function updateTable(
  id: string,
  input: Partial<{ number: number; isActive: boolean }>
): Promise<TableInfo> {
  const { data } = await staffRequest<TableInfo>(`/api/tables/${id}`, {
    method: 'PATCH',
    body: input,
  })
  return data
}

export async function deleteTable(id: string): Promise<void> {
  await staffRequest<TableInfo>(`/api/tables/${id}`, { method: 'DELETE' })
}

export async function getTableQr(id: string): Promise<TableQr> {
  const { data } = await staffRequest<TableQr>(`/api/tables/${id}/qr`)
  return data
}

/* ---------- Usuarios ---------- */

export async function listUsers(): Promise<StaffUser[]> {
  const { data } = await staffRequest<StaffUser[]>('/api/users?limit=100')
  return data
}

export async function createUser(input: UserInput): Promise<StaffUser> {
  const { data } = await staffRequest<StaffUser>('/api/users', { method: 'POST', body: input })
  return data
}

export async function updateUser(id: string, input: Partial<UserInput>): Promise<StaffUser> {
  const { data } = await staffRequest<StaffUser>(`/api/users/${id}`, {
    method: 'PATCH',
    body: input,
  })
  return data
}

export async function deleteUser(id: string): Promise<void> {
  await staffRequest<StaffUser>(`/api/users/${id}`, { method: 'DELETE' })
}

/* ---------- Ajustes del restaurante ---------- */

export async function getTenantSettings(): Promise<TenantSettings> {
  const { data } = await staffRequest<TenantSettings>('/api/tenant')
  return data
}

export async function updateTenantSettings(input: TenantSettingsInput): Promise<TenantSettings> {
  const { data } = await staffRequest<TenantSettings>('/api/tenant', {
    method: 'PATCH',
    body: input,
  })
  return data
}

/* ---------- Upload ---------- */

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)

  const response = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    headers: { authorization: `Bearer ${authToken()}` },
    body: form,
  })
  const payload = (await response.json().catch(() => null)) as {
    data?: { url: string }
    error?: { code?: string; message?: string }
  } | null

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error?.code ?? 'INTERNAL_ERROR',
      payload?.error?.message ?? 'Error al subir la imagen'
    )
  }

  return payload?.data?.url ?? ''
}
