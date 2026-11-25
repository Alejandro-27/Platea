import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { OrderTicket } from '@/components/kds/OrderTicket'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { StaffLayout } from '@/components/staff/StaffLayout'
import { Button } from '@/components/ui/Button'
import { listOrders, updateItemStatus, updateOrderStatus } from '@/lib/staff'
import { createStaffSocket } from '@/lib/socket'
import { playChime } from '@/lib/sound'
import { useAuth } from '@/store/auth'
import type { Order, OrderItem, OrderItemStatus, OrderStatus } from '@/types/api'

const COLUMNS: OrderStatus[] = ['PENDING', 'PREPARING', 'READY']

export default function KitchenPage() {
  const { t } = useTranslation()
  const token = useAuth((state) => state.token)
  const tenantId = useAuth((state) => state.tenant?.id)

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [sound, setSound] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [busyItemId, setBusyItemId] = useState<string | null>(null)

  const soundRef = useRef(sound)
  useEffect(() => {
    soundRef.current = sound
  })

  // Los ids tocados por Socket.io no se pisan con la foto inicial de la API.
  const touched = useRef(new Set<string>())

  const upsert = useCallback((order: Order) => {
    touched.current.add(order.id)
    setOrders((previous) => {
      const merged = previous.some((item) => item.id === order.id)
        ? previous.map((item) => (item.id === order.id ? order : item))
        : [...previous, order]
      return merged.filter((item) => COLUMNS.includes(item.status))
    })
  }, [])

  useEffect(() => {
    if (!token) return
    let active = true

    listOrders({ limit: 100 })
      .then((data) => {
        if (!active) return
        // Los eventos recibidos mientras cargaba mandan sobre la foto inicial.
        setOrders((previous) => {
          const merged = new Map(
            data.filter((order) => !touched.current.has(order.id)).map((order) => [order.id, order])
          )
          for (const order of previous) merged.set(order.id, order)
          return [...merged.values()].filter((order) => COLUMNS.includes(order.status))
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
    const join = () => socket.emit('room:join', `kds:${tenantId}`)

    socket.on('connect', join)
    socket.on('order:new', (order: Order) => {
      if (soundRef.current) playChime()
      upsert(order)
    })
    socket.on('order:updated', (order: Order) => upsert(order))
    if (socket.connected) join()

    return () => {
      socket.off()
      socket.disconnect()
    }
  }, [token, tenantId, upsert])

  const advance = async (order: Order, status: OrderStatus) => {
    setBusyId(order.id)
    try {
      upsert(await updateOrderStatus(order.id, status))
    } catch {
      setError(true)
    } finally {
      setBusyId(null)
    }
  }

  const advanceItem = async (order: Order, item: OrderItem, status: OrderItemStatus) => {
    setBusyItemId(item.id)
    try {
      upsert(await updateItemStatus(order.id, item.id, status))
    } catch {
      setError(true)
    } finally {
      setBusyItemId(null)
    }
  }

  return (
    <StaffLayout
      title={t('staff.kds.title')}
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            // El primer clic también desbloquea el audio del navegador.
            if (!sound) playChime()
            setSound((value) => !value)
          }}
        >
          {sound ? (
            <Volume2 className="h-4 w-4" aria-hidden />
          ) : (
            <VolumeX className="h-4 w-4" aria-hidden />
          )}
          {sound ? t('staff.kds.soundOn') : t('staff.kds.soundOff')}
        </Button>
      }
    >
      {loading ? (
        <LoadingState label={t('common.loading')} />
      ) : error ? (
        <ErrorState title={t('staff.error')} />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((status) => {
            const column = orders
              .filter((order) => order.status === status)
              .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

            return (
              <section key={status} aria-label={t(`order.status.${status}`)} className="space-y-3">
                <h2 className="flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-muted">
                  {t(`order.status.${status}`)}
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs">
                    {column.length}
                  </span>
                </h2>

                {column.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-sm text-muted">
                    {t('staff.kds.empty')}
                  </p>
                ) : (
                  column.map((order) => (
                    <OrderTicket
                      key={order.id}
                      order={order}
                      busy={busyId === order.id}
                      busyItemId={busyItemId}
                      onAdvance={(next) => void advance(order, next)}
                      onAdvanceItem={(item, next) => void advanceItem(order, item, next)}
                    />
                  ))
                )}
              </section>
            )
          })}
        </div>
      )}
    </StaffLayout>
  )
}
