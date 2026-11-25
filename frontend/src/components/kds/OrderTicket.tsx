import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { formatTime } from '@/lib/money'
import type { Order, OrderItem, OrderItemStatus, OrderStatus } from '@/types/api'

interface OrderTicketProps {
  order: Order
  busy: boolean
  busyItemId: string | null
  onAdvance: (status: OrderStatus) => void
  onAdvanceItem: (item: OrderItem, status: OrderItemStatus) => void
}

function minutesSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
}

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: 'PREPARING',
  PREPARING: 'READY',
  READY: 'SERVED',
}

const ACTION_KEY: Partial<Record<OrderStatus, string>> = {
  PENDING: 'staff.kds.start',
  PREPARING: 'staff.kds.markReady',
  READY: 'staff.kds.markServed',
}

const ITEM_NEXT: Partial<Record<OrderItemStatus, OrderItemStatus>> = {
  PENDING: 'PREPARING',
  PREPARING: 'READY',
}

const ITEM_ACTION_KEY: Partial<Record<OrderItemStatus, string>> = {
  PENDING: 'staff.kds.start',
  PREPARING: 'staff.kds.markReady',
}

const ITEM_STATUS_CLASS: Record<OrderItemStatus, string> = {
  PENDING: 'bg-surface text-muted',
  PREPARING: 'bg-amber-100 text-amber-800',
  READY: 'bg-emerald-100 text-emerald-800',
  SERVED: 'bg-surface text-muted',
}

export function OrderTicket({
  order,
  busy,
  busyItemId,
  onAdvance,
  onAdvanceItem,
}: OrderTicketProps) {
  const { t, i18n } = useTranslation()
  const next = NEXT[order.status]

  return (
    <article className="rounded-2xl bg-surface-2 p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-lg font-semibold">
          {order.table
            ? t('staff.kds.table', { number: order.table.number })
            : t('staff.kds.noTable')}
        </span>
        <span className="text-sm text-muted">
          {t('staff.kds.minutes', { count: minutesSince(order.createdAt) })} ·{' '}
          {formatTime(order.createdAt, i18n.language)}
        </span>
      </div>

      <ul className="mt-3 space-y-2">
        {order.items.map((item) => {
          const itemNext = ITEM_NEXT[item.itemStatus]

          return (
            <li key={item.id} className="border-t border-line pt-2 first:border-0 first:pt-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">
                    <span className="mr-2 inline-block min-w-6 font-semibold">
                      {item.quantity}×
                    </span>
                    {item.dish.name}
                  </p>
                  {item.notes && <p className="mt-0.5 text-sm text-amber-700">{item.notes}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      ITEM_STATUS_CLASS[item.itemStatus]
                    )}
                  >
                    {t(`order.itemStatus.${item.itemStatus}`)}
                  </span>
                  {itemNext && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy || busyItemId === item.id}
                      onClick={() => onAdvanceItem(item, itemNext)}
                    >
                      {t(ITEM_ACTION_KEY[item.itemStatus] ?? 'staff.kds.start')}
                    </Button>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {order.notes && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {order.notes}
        </p>
      )}

      {next && (
        <Button size="lg" className="mt-4 w-full" disabled={busy} onClick={() => onAdvance(next)}>
          {t(ACTION_KEY[order.status] ?? 'staff.kds.start')}
        </Button>
      )}
    </article>
  )
}
