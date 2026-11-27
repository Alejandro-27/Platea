import type {
  AuthSession,
  CreateOrderInput,
  Order,
  PaginationMeta,
  PublicMenu,
  PublicTenant,
  Session,
} from '../types/api'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  token?: string
  sessionId?: string
  signal?: AbortSignal
}

export interface ApiEnvelope<T> {
  data: T
  meta?: PaginationMeta
}

async function parse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/** Devuelve el sobre completo `{ data, meta }` para listas paginadas. */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiEnvelope<T>> {
  const { method = 'GET', body, token, sessionId, signal } = options

  let response: Response
  try {
    response = await fetch(API_URL + path, {
      method,
      signal,
      headers: {
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(sessionId ? { 'x-session-id': sessionId } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor')
  }

  const payload = (await parse(response)) as {
    data?: T
    meta?: PaginationMeta
    error?: { code?: string; message?: string }
  } | null

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error?.code ?? 'INTERNAL_ERROR',
      payload?.error?.message ?? 'Error inesperado'
    )
  }

  return { data: payload?.data as T, meta: payload?.meta }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return (await apiRequest<T>(path, options)).data
}

/* ---------- Comensal ---------- */

export function getMenu(tenantId: string): Promise<PublicMenu> {
  return request<PublicMenu>(`/api/public/tenants/${encodeURIComponent(tenantId)}/menu`)
}

export function getTenantBySlug(slug: string): Promise<PublicTenant> {
  return request<PublicTenant>(`/api/public/tenants/${encodeURIComponent(slug)}`)
}

export function createSession(tenantId: string, tableId: string): Promise<Session> {
  return request<Session>('/api/public/sessions', {
    method: 'POST',
    body: { tenantId, tableId },
  })
}

export function getSession(sessionId: string): Promise<Session> {
  return request<Session>(`/api/public/sessions/${encodeURIComponent(sessionId)}`)
}

export function createOrder(sessionId: string, input: CreateOrderInput): Promise<Order> {
  return request<Order>('/api/public/orders', { method: 'POST', body: input, sessionId })
}

export function getOrder(sessionId: string, orderId: string): Promise<Order> {
  return request<Order>(`/api/public/orders/${encodeURIComponent(orderId)}`, { sessionId })
}

/* ---------- Auth ---------- */

export function login(email: string, password: string): Promise<AuthSession> {
  return request<AuthSession>('/api/auth/login', { method: 'POST', body: { email, password } })
}
