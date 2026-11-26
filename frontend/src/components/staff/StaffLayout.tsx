import type { ReactNode } from 'react'
import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layout as LayoutIcon,
  Table as TableIcon,
  List as ListIcon,
  Package as PackageIcon,
  ShoppingBag as ShoppingBagIcon,
  User as UserIcon,
  Settings as SettingsIcon,
  Flame as FlameIcon,
  UserRound as UserRoundIcon,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from '@/components/LanguageToggle'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { useAuth } from '@/store/auth'
import type { UserRole } from '@/types/api'

interface NavItem {
  to: string
  key: string
}

const NAV: Record<UserRole, NavItem[]> = {
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

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'staff.nav.dashboard': LayoutIcon,
  'staff.nav.dishes': TableIcon,
  'staff.nav.categories': ListIcon,
  'staff.nav.tables': TableIcon,
  'staff.nav.ingredients': PackageIcon,
  'staff.nav.orders': ShoppingBagIcon,
  'staff.nav.users': UserIcon,
  'staff.nav.settings': SettingsIcon,
  'staff.nav.kitchen': FlameIcon,
  'staff.nav.waiter': UserRoundIcon,
}

interface StaffLayoutProps {
  children: ReactNode
  title?: string
  actions?: ReactNode
}

export function StaffLayout({ children, title, actions }: StaffLayoutProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const role = useAuth((state) => state.user?.role)
  const email = useAuth((state) => state.user?.email)
  const tenantName = useAuth((state) => state.tenant?.name)
  const logout = useAuth((state) => state.logout)

  const [sidebarOpen, setSidebarOpen] = useState(false)

  const links = role ? NAV[role] : []

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
    setSidebarOpen(false)
  }

  const isActive = (to: string) => pathname === to || (to !== '/' && pathname.startsWith(to))

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header superior (visible en desktop y mobile) */}
      <header className="border-b border-slate-200 bg-white z-20">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          {/* Logo / marca */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <div className="h-5 w-5 text-white" aria-hidden>
                Q
              </div>
            </div>
            <span className="font-playfair font-bold text-xl tracking-tight text-slate-900">
              {tenantName ?? 'Platea'}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Hamburger solo en mobile */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>

            <LanguageToggle />

            <span className="hidden text-sm text-muted md:inline">{email}</span>

            <Button variant="ghost" size="sm" className="md:block" onClick={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="ml-1.5 hidden md:inline">{t('staff.logout')}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar desktop (oculto en mobile) */}
        <nav className="hidden md:flex md:w-64 flex-col border-r border-slate-200 bg-white">
          <div className="p-4 border-b border-slate-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm mb-3">
              <div className="h-5 w-5 text-white" aria-hidden>
                Q
              </div>
            </div>
            <span className="font-playfair font-bold text-xl tracking-tight text-slate-900 block">
              {tenantName ?? 'Platea'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {links.map((link) => {
                const active = isActive(link.to)
                const Icon = ICONS[link.key] as React.ComponentType<{ className?: string }>
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/admin'}
                    className={({ isActive: navActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20',
                        navActive
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm'
                          : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      )
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon
                      className={cn('shrink-0', active ? 'text-emerald-700' : 'text-slate-400')}
                    />
                    {t(link.key)}
                  </NavLink>
                )
              })}
            </div>
          </div>

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-medium text-xs">
                {email ? email.slice(0, 1).toUpperCase() : '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">{email}</p>
                <p className="text-xs text-slate-400 truncate">{role}</p>
              </div>
            </div>
            <div className="mt-3">
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" aria-hidden />
                {t('staff.logout')}
              </Button>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0 bg-slate-50">
          {(title || actions) && (
            <div className="border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  {title && (
                    <h1 className="font-playfair font-bold text-lg text-slate-900 leading-tight">
                      {title}
                    </h1>
                  )}
                </div>
                {actions}
              </div>
            </div>
          )}
          <div className="px-6 pb-8">{children}</div>
        </main>
      </div>

      {/* Overlay móvil */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
            role="button"
            tabIndex={-1}
          />
        )}
      </AnimatePresence>
      {/* Drawer móvil */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.nav
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed left-0 top-0 z-50 h-dvh w-64 bg-white border-r border-slate-200 shadow-2xl md:hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <div className="h-4 w-4 text-white" aria-hidden>
                    Q
                  </div>
                </div>
                <span className="font-playfair font-bold text-lg tracking-tight text-slate-900">
                  {tenantName ?? 'Platea'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
              {links.map((link) => {
                const active = isActive(link.to)
                const Icon = ICONS[link.key] as React.ComponentType<{ className?: string }>
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/admin'}
                    className={({ isActive: navActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20',
                        navActive
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm'
                          : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      )
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon
                      className={cn('shrink-0', active ? 'text-emerald-700' : 'text-slate-400')}
                    />
                    {t(link.key)}
                  </NavLink>
                )
              })}
            </div>
            <div className="p-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-medium text-xs">
                  {email ? email.slice(0, 1).toUpperCase() : '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{email}</p>
                  <p className="text-xs text-slate-400 truncate">{role}</p>
                </div>
              </div>
              <div className="mt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" aria-hidden />
                  {t('staff.logout')}
                </Button>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  )
}
