import { motion } from 'framer-motion'
import { ShoppingCart, Table as TableIcon, List, Package, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { StaffLayout } from '@/components/staff/StaffLayout'
import { useAsync } from '@/hooks/useAsync'
import { listCategories, listDishes, listIngredients, listOrders, listTables } from '@/lib/staff'
import { cn } from '@/lib/cn'

const ACTIVE = ['PENDING', 'PREPARING', 'READY']

const METRICS: Array<{
  key: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
  color: string
}> = [
  {
    key: 'activeOrders',
    label: 'staff.admin.dashboard.activeOrders',
    Icon: ShoppingCart,
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    key: 'dishes',
    label: 'staff.nav.dishes',
    Icon: TableIcon,
    color: 'text-blue-600 bg-blue-50',
  },
  {
    key: 'categories',
    label: 'staff.nav.categories',
    Icon: List,
    color: 'text-amber-600 bg-amber-50',
  },
  {
    key: 'tables',
    label: 'staff.nav.tables',
    Icon: TableIcon,
    color: 'text-indigo-600 bg-indigo-50',
  },
  {
    key: 'ingredients',
    label: 'staff.nav.ingredients',
    Icon: Package,
    color: 'text-purple-600 bg-purple-50',
  },
  {
    key: 'totalOrders',
    label: 'staff.admin.dashboard.totalOrders',
    Icon: Clock,
    color: 'text-rose-600 bg-rose-50',
  },
]

export default function AdminDashboardPage() {
  const { t } = useTranslation()
  const dishes = useAsync(() => listDishes(), 'dash-dishes')
  const categories = useAsync(listCategories, 'dash-categories')
  const tables = useAsync(listTables, 'dash-tables')
  const ingredients = useAsync(listIngredients, 'dash-ingredients')
  const orders = useAsync(() => listOrders({ limit: 100 }), 'dash-orders')

  const states = [dishes, categories, tables, ingredients, orders]

  if (states.some((state) => state.status === 'loading')) {
    return (
      <StaffLayout title={t('staff.nav.dashboard')}>
        <LoadingState label={t('common.loading')} />
      </StaffLayout>
    )
  }

  if (states.some((state) => state.status === 'error')) {
    return (
      <StaffLayout title={t('staff.nav.dashboard')}>
        <ErrorState title={t('staff.error')} onRetry={orders.reload} />
      </StaffLayout>
    )
  }

  const orderList = orders.data ?? []
  const dishList = dishes.data ?? []
  const categoryList = categories.data ?? []
  const tableList = tables.data ?? []
  const ingredientList = ingredients.data ?? []

  const values: number[] = [
    orderList.filter((order) => ACTIVE.includes(order.status)).length,
    dishList.length,
    categoryList.length,
    tableList.filter((table) => table.isActive).length,
    ingredientList.length,
    orderList.length,
  ]

  return (
    <StaffLayout title={t('staff.nav.dashboard')}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {METRICS.map((metric, i) => (
          <motion.div
            key={metric.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.4, ease: 'easeOut' }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-600">{t(metric.label)}</p>
              <div
                className={cn('flex h-9 w-9 items-center justify-center rounded-xl', metric.color)}
              >
                <metric.Icon className="h-5 w-5" aria-hidden />
              </div>
            </div>
            <p className="text-3xl font-playfair font-bold text-slate-900">{values[i]}</p>
          </motion.div>
        ))}
      </div>
    </StaffLayout>
  )
}
