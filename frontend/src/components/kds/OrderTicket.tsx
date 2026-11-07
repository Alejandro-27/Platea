import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { formatTime } from '@/lib/money'
import type { Order, OrderStatus } from '@/types/api'

interface OrderTicketProps {
  order: Order
  busy: boolean
  onAdvance: (status: OrderStatus) => void
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

export function OrderTicket({ order, busy, onAdvance }: OrderTicketProps) {
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
        {order.items.map((item) => (
          <li key={item.id} className="border-t border-line pt-2 first:border-0 first:pt-0">
            <p className="font-medium">
              <span className="mr-2 inline-block min-w-6 font-semibold">{item.quantity}×</span>
              {item.dish.name}
            </p>
            {item.notes && <p className="mt-0.5 text-sm text-amber-700">{item.notes}</p>}
          </li>
        ))}
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
