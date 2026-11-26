import { useState } from 'react'
import { motion } from 'framer-motion'
import { Filter, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { StaffLayout } from '@/components/staff/StaffLayout'
import { Select } from '@/components/ui/Form'
import { useAsync } from '@/hooks/useAsync'
import { formatMoney, formatTime } from '@/lib/money'
import { listOrders } from '@/lib/staff'
import { cn } from '@/lib/cn'
import type { OrderStatus } from '@/types/api'

const STATUSES: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED']

const STATUS_BADGE: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  PREPARING: 'bg-blue-100 text-blue-800',
  READY: 'bg-emerald-100 text-emerald-800',
  SERVED: 'bg-slate-100 text-slate-600',
  CANCELLED: 'bg-rose-100 text-rose-800',
}

export default function AdminOrdersPage() {
  const { t, i18n } = useTranslation()
  const [status, setStatus] = useState('')
  const orders = useAsync(
    () => listOrders({ status: status || undefined, limit: 100 }),
    `orders:${status}`
  )

  return (
    <StaffLayout title={t('staff.nav.orders')}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Filter
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <Select
            aria-label={t('staff.admin.orders.filter')}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-11 w-full pl-9"
          >
            <option value="">{t('staff.admin.orders.all')}</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {t(`order.status.${value}`)}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 font-medium">
            {orders.status === 'ready' ? orders.data.length : 0}
          </span>
          <span className="text-slate-400">{t('staff.nav.orders')}</span>
        </div>
      </div>

      {orders.status === 'loading' ? (
        <LoadingState label={t('common.loading')} />
      ) : orders.status === 'error' ? (
        <ErrorState title={t('staff.error')} onRetry={orders.reload} />
      ) : orders.data.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-6 text-slate-400">
            <Clock className="h-10 w-10" aria-hidden />
          </div>
          <h3 className="font-playfair font-bold text-lg text-slate-900 mb-2">
            {t('staff.admin.empty')}
          </h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">No hay pedidos con ese filtro.</p>
        </motion.div>
      ) : (
        <ul className="grid gap-3">
          {orders.data.map((order) => (
            <motion.li
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * orders.data.indexOf(order) }}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">
                    {order.table
                      ? t('staff.kds.table', { number: order.table.number })
                      : t('staff.kds.noTable')}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatTime(order.createdAt, i18n.language)}
                  </p>
                </div>
                <div className="flex items-end gap-2">
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      STATUS_BADGE[order.status]
                    )}
                  >
                    {t(`order.status.${order.status}`)}
                  </span>
                  <span className="font-playfair font-bold text-slate-900">
                    {formatMoney(order.total, i18n.language)}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {order.items.map((item) => `${item.quantity}× ${item.dish.name}`).join(', ')}
              </p>
            </motion.li>
          ))}
        </ul>
      )}
    </StaffLayout>
  )
}
