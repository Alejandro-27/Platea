import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { roleHome, useAuth } from '@/store/auth'
import type { UserRole } from '@/types/api'

interface RequireRoleProps {
  roles: UserRole[]
  children: ReactNode
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const token = useAuth((state) => state.token)
  const role = useAuth((state) => state.user?.role)
  const location = useLocation()

  if (!token || !role) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (!roles.includes(role)) {
    return <Navigate to={roleHome(role)} replace />
  }

  return <>{children}</>
}
