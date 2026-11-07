import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CartBar } from '@/components/CartBar'
import { CartSheet } from '@/components/CartSheet'
import { DishCard } from '@/components/DishCard'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { MenuHeader } from '@/components/MenuHeader'
import { useSession } from '@/hooks/useSession'
import { getMenu } from '@/lib/api'
import { cn } from '@/lib/cn'
import { readableTextColor, safeBrandColor } from '@/lib/color'
import { priceToCents } from '@/lib/money'
import { useCart } from '@/store/cart'
import type { PublicMenu } from '@/types/api'
import { ScanPage } from './ScanPage'

type MenuState = 'loading' | 'ready' | 'error'

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'whitespace-nowrap rounded-full border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        active
          ? 'border-transparent bg-brand text-brand-fg'
          : 'border-line bg-surface-2 text-muted hover:text-ink'
      )}
    >
      {children}
    </button>
  )
}

export default function MenuPage() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const [searchParams] = useSearchParams()
  const tableId = searchParams.get('table')
  const { t } = useTranslation()

  const sessionState = useSession(tenantId ?? null, tableId)
  const [menu, setMenu] = useState<PublicMenu | null>(null)
  const [menuState, setMenuState] = useState<MenuState>('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [cartOpen, setCartOpen] = useState(false)

  const lines = useCart((state) => state.lines)
  const setScope = useCart((state) => state.setScope)

  useEffect(() => {
    if (!tenantId) return

    let active = true

    getMenu(tenantId)
      .then((data) => {
        if (!active) return
        setMenu(data)
        setMenuState('ready')
      })
      .catch(() => {
        if (active) setMenuState('error')
      })

    return () => {
      active = false
    }
  }, [tenantId, reloadKey])

  useEffect(() => {
    if (sessionState.status === 'ready' && tenantId && tableId) {
      setScope(tenantId, tableId)
    }
  }, [sessionState, tenantId, tableId, setScope])

  // Las variables viven en :root para que el portal del carrito herede la marca.
  useEffect(() => {
    if (!menu) return
    const brand = safeBrandColor(menu.tenant.primaryColor, '#0f766e')
    document.documentElement.style.setProperty('--brand', brand)
    document.documentElement.style.setProperty('--brand-fg', readableTextColor(brand))
  }, [menu])

  const filteredCategories = useMemo(() => {
    if (!menu) return []
    const term = query.trim().toLowerCase()

    return menu.categories
      .map((category) => ({
        ...category,
        dishes: category.dishes.filter(
          (dish) =>
            term.length === 0 ||
            dish.name.toLowerCase().includes(term) ||
            (dish.description ?? '').toLowerCase().includes(term)
        ),
      }))
      .filter(
        (category) =>
          category.dishes.length > 0 && (activeCategory === 'all' || category.id === activeCategory)
      )
  }, [menu, query, activeCategory])

  if (!tenantId || !tableId) return <ScanPage />

  if (menuState === 'error') {
    return (
      <ErrorState
        title={t('menu.loadError')}
        onRetry={() => {
          setMenuState('loading')
          setReloadKey((key) => key + 1)
        }}
      />
    )
  }

  if (sessionState.status === 'error') {
    return <ErrorState title={t('menu.sessionError')} />
  }

  if (menuState === 'loading' || !menu || sessionState.status === 'loading') {
    return <LoadingState label={t('common.loading')} />
  }

  const count = lines.reduce((sum, line) => sum + line.quantity, 0)
  const totalCents = lines.reduce((sum, line) => sum + priceToCents(line.price) * line.quantity, 0)
  const menuIsEmpty = menu.categories.every((category) => category.dishes.length === 0)

  return (
    <div className="min-h-dvh pb-28">
      <MenuHeader tenant={menu.tenant} tableNumber={sessionState.session.tableNumber} />

      <main className="mx-auto max-w-3xl px-4">
        <div className="pt-4">
          <label htmlFor="menu-search" className="sr-only">
            {t('menu.search')}
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              id="menu-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('menu.search')}
              className="h-11 w-full rounded-xl border border-line bg-surface-2 pl-9 pr-3 text-base placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
          </div>
        </div>

        <div className="sticky top-16 z-20 -mx-4 mt-3 overflow-x-auto bg-surface px-4 py-2">
          <div className="flex gap-2">
            <CategoryChip
              active={activeCategory === 'all'}
              onClick={() => setActiveCategory('all')}
            >
              {t('menu.all')}
            </CategoryChip>
            {menu.categories.map((category) => (
              <CategoryChip
                key={category.id}
                active={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </CategoryChip>
            ))}
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <p className="py-16 text-center text-muted">
            {menuIsEmpty ? t('menu.empty') : t('menu.noResults')}
          </p>
        ) : (
          <div className="space-y-6 pb-6">
            {filteredCategories.map((category) => (
              <section key={category.id} aria-labelledby={`category-${category.id}`}>
                <h2 id={`category-${category.id}`} className="mb-2 text-lg font-semibold">
                  {category.name}
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {category.dishes.map((dish) => (
                    <DishCard key={dish.id} dish={dish} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {count > 0 && (
        <CartBar count={count} totalCents={totalCents} onOpen={() => setCartOpen(true)} />
      )}
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} sessionId={sessionState.session.id} />
    </div>
  )
}
