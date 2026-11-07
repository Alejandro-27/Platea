import { useTranslation } from 'react-i18next'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { StaffLayout } from '@/components/staff/StaffLayout'
import { useAsync } from '@/hooks/useAsync'
import { listCategories, listDishes, listIngredients, listOrders, listTables } from '@/lib/staff'

const ACTIVE = ['PENDING', 'PREPARING', 'READY']

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-4 shadow-card">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { t } = useTranslation()
  const dishes = useAsync(() => listDishes(), 'dash-dishes')
  const categories = useAsync(listCategories, 'dash-categories')
  const tables = useAsync(listTables, 'dash-tables')
  const ingredients = useAsync(listIngredients, 'dash-ingredients')
  const orders = useAsync(() => listOrders({ limit: 100 }), 'dash-orders')

  const states = [dishes, categories, tables, ingredients, orders]

  return (
    <StaffLayout title={t('staff.nav.dashboard')}>
      {states.some((state) => state.status === 'loading') ? (
        <LoadingState label={t('common.loading')} />
      ) : states.some((state) => state.status === 'error') ? (
        <ErrorState title={t('staff.error')} onRetry={orders.reload} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric
            label={t('staff.admin.dashboard.activeOrders')}
            value={(orders.data ?? []).filter((order) => ACTIVE.includes(order.status)).length}
          />
          <Metric label={t('staff.nav.dishes')} value={(dishes.data ?? []).length} />
          <Metric label={t('staff.nav.categories')} value={(categories.data ?? []).length} />
          <Metric
            label={t('staff.nav.tables')}
            value={(tables.data ?? []).filter((table) => table.isActive).length}
          />
          <Metric label={t('staff.nav.ingredients')} value={(ingredients.data ?? []).length} />
          <Metric
            label={t('staff.admin.dashboard.totalOrders')}
            value={(orders.data ?? []).length}
          />
        </div>
      )}
    </StaffLayout>
  )
}
