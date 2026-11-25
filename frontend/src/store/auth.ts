import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthSession, StaffTenant, StaffUser, UserRole } from '@/types/api'

interface AuthState {
  token: string | null
  user: StaffUser | null
  tenant: StaffTenant | null
  setSession: (session: AuthSession) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      tenant: null,
      setSession: ({ token, user, tenant }) => set({ token, user, tenant }),
      logout: () => set({ token: null, user: null, tenant: null }),
    }),
    { name: 'platea-staff', version: 1 }
  )
)

export function roleHome(role: UserRole | null | undefined): string {
  switch (role) {
    case 'KITCHEN':
      return '/kds'
    case 'STAFF':
      return '/waiter'
    case 'ADMIN':
      return '/admin'
    default:
      return '/login'
  }
}
