import { useEffect, useState } from 'react'
import { createSession, getSession } from '@/lib/api'
import { readStoredSession, writeStoredSession } from '@/lib/session'
import type { Session, StoredSession } from '@/types/api'

export type SessionState =
  | { status: 'loading' }
  | { status: 'ready'; session: StoredSession }
  | { status: 'error'; code: 'missing-table' | 'session' }

// StrictMode ejecuta el efecto dos veces en desarrollo: deduplicamos la creación.
const pending = new Map<string, Promise<Session>>()

function createOnce(tenantId: string, tableId: string): Promise<Session> {
  const key = `${tenantId}:${tableId}`
  const inFlight = pending.get(key)
  if (inFlight) return inFlight

  const request = createSession(tenantId, tableId).finally(() => pending.delete(key))
  pending.set(key, request)
  return request
}

export function useSession(tenantId: string | null, tableId: string | null): SessionState {
  const [state, setState] = useState<SessionState>({ status: 'loading' })

  useEffect(() => {
    if (!tenantId || !tableId) return

    let active = true

    const load = async () => {
      const stored = readStoredSession()
      if (stored && stored.tenantId === tenantId && stored.tableId === tableId) {
        try {
          const session = await getSession(stored.id)
          if (!active) return
          const restored: StoredSession = { ...stored, expiresAt: session.expiresAt }
          writeStoredSession(restored)
          setState({ status: 'ready', session: restored })
          return
        } catch {
          // Sesión caducada o inexistente: se crea una nueva.
        }
      }

      try {
        const session = await createOnce(tenantId, tableId)
        if (!active) return
        const created: StoredSession = {
          id: session.id,
          tenantId,
          tableId,
          tableNumber: session.table.number,
          expiresAt: session.expiresAt,
        }
        writeStoredSession(created)
        setState({ status: 'ready', session: created })
      } catch {
        if (active) setState({ status: 'error', code: 'session' })
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [tenantId, tableId])

  if (!tenantId || !tableId) return { status: 'error', code: 'missing-table' }
  return state
}
