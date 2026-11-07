import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { StaffLayout } from '@/components/staff/StaffLayout'
import { Button } from '@/components/ui/Button'
import { formatMoney } from '@/lib/money'
import { listOrders, updateOrderStatus } from '@/lib/staff'
import { createStaffSocket } from '@/lib/socket'
import { useAuth } from '@/store/auth'
import type { Order, OrderStatus } from '@/types/api'

const ACTIVE: OrderStatus[] = ['PENDING', 'PREPARING', 'READY']

export default function WaiterPage() {
  const { t, i18n } = useTranslation()
  const token = useAuth((state) => state.token)
  const tenantId = useAuth((state) => state.tenant?.id)

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const touched = useRef(new Set<string>())

  const upsert = useCallback((order: Order) => {
    touched.current.add(order.id)
    setOrders((previous) => {
      const merged = previous.some((item) => item.id === order.id)
        ? previous.map((item) => (item.id === order.id ? order : item))
        : [...previous, order]
      return merged.filter((item) => ACTIVE.includes(item.status))
    })
  }, [])

  useEffect(() => {
    if (!token) return
    let active = true

    listOrders({ limit: 100 })
      .then((data) => {
        if (!active) return
        setOrders((previous) => {
          const merged = new Map(
            data.filter((order) => !touched.current.has(order.id)).map((order) => [order.id, order])
          )
          for (const order of previous) merged.set(order.id, order)
          return [...merged.values()].filter((order) => ACTIVE.includes(order.status))
        })
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError(true)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token])

  useEffect(() => {
    if (!token || !tenantId) return

    const socket = createStaffSocket(token)
    const join = () => socket.emit('room:join', `waiter:${tenantId}`)

    socket.on('connect', join)
    socket.on('order:new', (order: Order) => upsert(order))
    socket.on('order:updated', (order: Order) => upsert(order))
    if (socket.connected) join()

    return () => {
      socket.off()
      socket.disconnect()
    }
  }, [token, tenantId, upsert])

  const markServed = async (order: Order) => {
    setBusyId(order.id)
    try {
      upsert(await updateOrderStatus(order.id, 'SERVED'))
    } catch {
      setError(true)
    } finally {
      setBusyId(null)
    }
  }

  const byTable = new Map<number, Order[]>()
  for (const order of orders) {
    const number = order.table?.number ?? 0
    byTable.set(number, [...(byTable.get(number) ?? []), order])
  }
  const tables = [...byTable.entries()].sort((a, b) => a[0] - b[0])

  return (
    <StaffLayout title={t('staff.waiter.title')}>
      {loading ? (
        <LoadingState label={t('common.loading')} />
      ) : error ? (
        <ErrorState title={t('staff.error')} />
      ) : tables.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-muted">
          {t('staff.waiter.empty')}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map(([number, tableOrders]) => (
            <section key={number} className="rounded-2xl bg-surface-2 p-4 shadow-card">
              <h2 className="font-semibold">
                {number > 0 ? t('staff.kds.table', { number }) : t('staff.kds.noTable')}
              </h2>
              <ul className="mt-3 space-y-3">
                {tableOrders.map((order) => (
                  <li
                    key={order.id}
                    className="border-t border-line pt-3 first:border-0 first:pt-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={
                          order.status === 'READY'
                            ? 'text-sm font-semibold text-emerald-700'
                            : 'text-sm font-medium text-muted'
                        }
                      >
                        {t(`order.status.${order.status}`)}
                      </span>
                      <span className="text-sm font-semibold">
                        {formatMoney(order.total, i18n.language)}
                      </span>
                    </div>
                    <ul className="mt-1 text-sm text-muted">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.quantity}× {item.dish.name}
                        </li>
                      ))}
                    </ul>
                    {order.status === 'READY' && (
                      <Button
                        size="sm"
                        className="mt-2 w-full"
                        disabled={busyId === order.id}
                        onClick={() => void markServed(order)}
                      >
                        {t('staff.waiter.markServed')}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </StaffLayout>
  )
}
