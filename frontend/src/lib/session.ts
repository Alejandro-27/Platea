import type { StoredSession } from '../types/api'

const STORAGE_KEY = 'platea-session'

export function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredSession>
    if (
      typeof parsed.id !== 'string' ||
      typeof parsed.tenantId !== 'string' ||
      typeof parsed.tableId !== 'string' ||
      typeof parsed.tableNumber !== 'number' ||
      typeof parsed.expiresAt !== 'string'
    ) {
      return null
    }
    return parsed as StoredSession
  } catch {
    return null
  }
}

export function writeStoredSession(session: StoredSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}
