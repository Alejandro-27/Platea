import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from '@/components/LanguageToggle'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { useAuth } from '@/store/auth'
import type { UserRole } from '@/types/api'

const NAV: Record<UserRole, Array<{ to: string; key: string }>> = {
  ADMIN: [
    { to: '/admin', key: 'staff.nav.dashboard' },
    { to: '/admin/dishes', key: 'staff.nav.dishes' },
    { to: '/admin/categories', key: 'staff.nav.categories' },
    { to: '/admin/tables', key: 'staff.nav.tables' },
    { to: '/admin/ingredients', key: 'staff.nav.ingredients' },
    { to: '/admin/orders', key: 'staff.nav.orders' },
    { to: '/admin/users', key: 'staff.nav.users' },
    { to: '/admin/settings', key: 'staff.nav.settings' },
    { to: '/kds', key: 'staff.nav.kitchen' },
    { to: '/waiter', key: 'staff.nav.waiter' },
  ],
  STAFF: [
    { to: '/waiter', key: 'staff.nav.waiter' },
    { to: '/kds', key: 'staff.nav.kitchen' },
  ],
  KITCHEN: [{ to: '/kds', key: 'staff.nav.kitchen' }],
  SUPER_ADMIN: [],
}

interface StaffLayoutProps {
  children: ReactNode
  title?: string
  actions?: ReactNode
}

export function StaffLayout({ children, title, actions }: StaffLayoutProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const role = useAuth((state) => state.user?.role)
  const email = useAuth((state) => state.user?.email)
  const tenantName = useAuth((state) => state.tenant?.name)
  const logout = useAuth((state) => state.logout)

  const links = role ? NAV[role] : []

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface-2">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
          <span className="font-semibold">{tenantName ?? 'Platea'}</span>
          <div className="ml-auto flex items-center gap-2">
            <LanguageToggle />
            <span className="hidden text-sm text-muted md:inline">{email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden />
              {t('staff.logout')}
            </Button>
          </div>
        </div>
        <nav
          aria-label={t('staff.nav.label')}
          className="mx-auto max-w-6xl overflow-x-auto px-4 pb-2"
        >
          <div className="flex gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/admin'}
                className={({ isActive }) =>
                  cn(
                    'whitespace-nowrap rounded-full border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                    isActive
                      ? 'border-transparent bg-brand text-brand-fg'
                      : 'border-line bg-surface-2 text-muted hover:text-ink'
                  )
                }
              >
                {t(link.key)}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4">
        {(title || actions) && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            {title && <h1 className="text-xl font-semibold">{title}</h1>}
            {actions}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
