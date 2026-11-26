import { motion } from 'framer-motion'
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
  PENDING: 'bg-slate-100 text-slate-600',
  PREPARING: 'bg-amber-100 text-amber-800',
  READY: 'bg-emerald-100 text-emerald-800',
  SERVED: 'bg-slate-100 text-slate-600',
}

const COLUMN_LEFT_BORDER: Partial<Record<OrderStatus, string>> = {
  PENDING: 'border-l-4 border-l-amber-500',
  PREPARING: 'border-l-4 border-l-blue-500',
  READY: 'border-l-4 border-l-emerald-500',
}

const STATUS_BADGE: Partial<Record<OrderStatus, string>> = {
  PENDING: 'bg-amber-500',
  PREPARING: 'bg-blue-500',
  READY: 'bg-emerald-500',
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
  const itemIndexMap = new Map(order.items.map((item, i) => [item.id, i]))

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200',
        COLUMN_LEFT_BORDER[order.status]
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm text-white',
              STATUS_BADGE[order.status]
            )}
          >
            {order.table ? order.table.number : '—'}
          </span>
        </div>
        <span className="text-xs text-slate-400">
          {minutesSince(order.createdAt)} min · {formatTime(order.createdAt, i18n.language)}
        </span>
      </div>

      <ul className="space-y-2">
        {order.items.map((item) => {
          const itemNext = ITEM_NEXT[item.itemStatus]
          const itemDelay = itemIndexMap.get(item.id) ?? 0

          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.05 * itemDelay }}
              className="border-t border-slate-100 pt-2 first:border-0 first:pt-0"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex min-w-6 items-center justify-center rounded bg-slate-50 px-1.5 text-xs font-semibold text-slate-600">
                      {item.quantity}×
                    </span>
                    <p className="font-medium text-slate-900 leading-tight">{item.dish.name}</p>
                  </div>
                  {item.notes && (
                    <p className="mt-1.5 text-sm text-amber-700 bg-amber-50/50 px-2 py-1 rounded inline-block">
                      {item.notes}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      ITEM_STATUS_CLASS[item.itemStatus]
                    )}
                  >
                    {t(`order.itemStatus.${item.itemStatus}` as const)}
                  </span>
                  {itemNext && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy || busyItemId === item.id}
                      onClick={() => onAdvanceItem(item, itemNext)}
                      className="text-xs px-3 py-1.5"
                    >
                      {t(ITEM_ACTION_KEY[item.itemStatus] ?? 'staff.kds.start')}
                    </Button>
                  )}
                </div>
              </div>
            </motion.li>
          )
        })}
      </ul>

      {order.notes && (
        <p className="mt-4 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-sm text-amber-800">
          {order.notes}
        </p>
      )}

      {next && (
        <Button
          size="lg"
          className="mt-5 w-full py-3 text-sm font-semibold"
          disabled={busy}
          onClick={() => onAdvance(next)}
        >
          {t(ACTION_KEY[order.status] ?? 'staff.kds.start')}
        </Button>
      )}
    </motion.article>
  )
}
