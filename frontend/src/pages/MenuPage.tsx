import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams, useSearchParams } from 'react-router-dom'
import { CartBar } from '@/components/CartBar'
import { CartSheet } from '@/components/CartSheet'
import { DishCard } from '@/components/DishCard'
import { DishDetail } from '@/components/DishDetail'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { MenuHeader } from '@/components/MenuHeader'
import { useSession } from '@/hooks/useSession'
import { getMenu } from '@/lib/api'
import { cn } from '@/lib/cn'
import { readableTextColor, safeBrandColor } from '@/lib/color'
import { priceToCents } from '@/lib/money'
import { useCart } from '@/store/cart'
import type { PublicDish, PublicMenu } from '@/types/api'
import { ScanPage } from './ScanPage'

type MenuState = 'loading' | 'ready' | 'error'
type DietFilter = 'all' | 'vegetarian' | 'glutenFree' | 'spicy'

const DIETS: DietFilter[] = ['all', 'vegetarian', 'glutenFree', 'spicy']

const DIET_KEY: Record<DietFilter, string> = {
  all: 'menu.all',
  vegetarian: 'menu.vegetarian',
  glutenFree: 'menu.glutenFree',
  spicy: 'menu.spicy',
}

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
        'whitespace-nowrap shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600',
        active
          ? 'border-transparent bg-emerald-600 text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
  const [diet, setDiet] = useState<DietFilter>('all')
  const [detail, setDetail] = useState<PublicDish | null>(null)
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
    const matchesDiet = (dish: PublicDish) =>
      diet === 'all' ||
      (diet === 'vegetarian' && dish.isVegetarian) ||
      (diet === 'glutenFree' && dish.isGlutenFree) ||
      (diet === 'spicy' && dish.isSpicy)

    return menu.categories
      .map((category) => ({
        ...category,
        dishes: category.dishes.filter(
          (dish) =>
            matchesDiet(dish) &&
            (term.length === 0 ||
              dish.name.toLowerCase().includes(term) ||
              (dish.description ?? '').toLowerCase().includes(term))
        ),
      }))
      .filter(
        (category) =>
          category.dishes.length > 0 && (activeCategory === 'all' || category.id === activeCategory)
      )
  }, [menu, query, activeCategory, diet])

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
    <div className="min-h-dvh pb-28 bg-white">
      <MenuHeader tenant={menu.tenant} tableNumber={sessionState.session.tableNumber} />

      <main className="mx-auto max-w-3xl px-4">
        {/* Search */}
        <div className="pt-6 sm:pt-8">
          <label htmlFor="menu-search" className="sr-only">
            {t('menu.search')}
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="menu-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('menu.search')}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-base text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            />
          </div>
        </div>

        {/* Diet filters */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {DIETS.map((value) => (
            <CategoryChip key={value} active={diet === value} onClick={() => setDiet(value)}>
              {t(DIET_KEY[value])}
            </CategoryChip>
          ))}
        </div>

        {/* Category filters (sticky) */}
        <div className="sticky top-14 z-20 -mx-4 mt-4 overflow-x-auto bg-white/80 backdrop-blur-sm px-4 py-2 border-b border-slate-100">
          <div className="flex gap-2 scrollbar-hide">
            <CategoryChip
              active={activeCategory === 'all'}
              onClick={() => setActiveCategory('all')}
            >
              {t('menu.allCategories')}
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

        {/* Dish list */}
        <AnimatePresence mode="wait">
          {filteredCategories.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mx-auto mb-4 text-slate-400">
                <Search className="h-6 w-6" aria-hidden />
              </div>
              <p className="text-sm text-slate-500">
                {menuIsEmpty ? t('menu.empty') : t('menu.noResults')}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-6 pb-8"
            >
              {filteredCategories.map((category) => (
                <section key={category.id} aria-labelledby={`category-${category.id}`}>
                  <motion.h2
                    id={`category-${category.id}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-3 text-xl font-playfair font-bold text-slate-900 tracking-tight"
                  >
                    {category.name}
                  </motion.h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {category.dishes.map((dish, i) => (
                      <motion.div
                        key={dish.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i, duration: 0.4, ease: 'easeOut' }}
                        className="flex flex-col"
                      >
                        <DishCard key={dish.id} dish={dish} onSelect={setDetail} />
                      </motion.div>
                    ))}
                  </div>
                </section>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {count > 0 && (
        <CartBar count={count} totalCents={totalCents} onOpen={() => setCartOpen(true)} />
      )}
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} sessionId={sessionState.session.id} />
      {detail && <DishDetail key={detail.id} dish={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}
