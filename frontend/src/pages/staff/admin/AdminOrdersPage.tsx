import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { StaffLayout } from '@/components/staff/StaffLayout'
import { Select } from '@/components/ui/Form'
import { useAsync } from '@/hooks/useAsync'
import { formatMoney, formatTime } from '@/lib/money'
import { listOrders } from '@/lib/staff'
import type { OrderStatus } from '@/types/api'

const STATUSES: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED']

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: 'text-muted',
  PREPARING: 'text-amber-700',
  READY: 'text-emerald-700',
  SERVED: 'text-muted',
  CANCELLED: 'text-rose-700',
}

export default function AdminOrdersPage() {
  const { t, i18n } = useTranslation()
  const [status, setStatus] = useState('')
  const orders = useAsync(
    () => listOrders({ status: status || undefined, limit: 100 }),
    `orders:${status}`
  )

  return (
    <StaffLayout
      title={t('staff.nav.orders')}
      actions={
        <Select
          aria-label={t('staff.admin.orders.filter')}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="w-44"
        >
          <option value="">{t('staff.admin.orders.all')}</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(`order.status.${value}`)}
            </option>
          ))}
        </Select>
      }
    >
      {orders.status === 'loading' ? (
        <LoadingState label={t('common.loading')} />
      ) : orders.status === 'error' ? (
        <ErrorState title={t('staff.error')} onRetry={orders.reload} />
      ) : orders.data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-muted">
          {t('staff.admin.empty')}
        </p>
      ) : (
        <ul className="space-y-2">
          {orders.data.map((order) => (
            <li key={order.id} className="rounded-xl bg-surface-2 p-3 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {order.table
                      ? t('staff.kds.table', { number: order.table.number })
                      : t('staff.kds.noTable')}
                    <span className={`ml-2 text-sm font-medium ${STATUS_COLOR[order.status]}`}>
                      {t(`order.status.${order.status}`)}
                    </span>
                  </p>
                  <p className="text-xs text-muted">{formatTime(order.createdAt, i18n.language)}</p>
                </div>
                <span className="font-semibold">{formatMoney(order.total, i18n.language)}</span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {order.items.map((item) => `${item.quantity}× ${item.dish.name}`).join(', ')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </StaffLayout>
  )
}
