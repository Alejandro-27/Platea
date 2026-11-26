import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, Utensils } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { OrderTicket } from '@/components/kds/OrderTicket'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { StaffLayout } from '@/components/staff/StaffLayout'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { listOrders, updateItemStatus, updateOrderStatus } from '@/lib/staff'
import { createStaffSocket } from '@/lib/socket'
import { playChime } from '@/lib/sound'
import { useAuth } from '@/store/auth'
import type { Order, OrderItem, OrderItemStatus, OrderStatus } from '@/types/api'

const COLUMNS: OrderStatus[] = ['PENDING', 'PREPARING', 'READY']

const COLUMN_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING: 'staff.kds.columnPending',
  PREPARING: 'staff.kds.columnPreparing',
  READY: 'staff.kds.columnReady',
}

const COLUMN_COLOR: Partial<Record<OrderStatus, string>> = {
  PENDING: 'text-amber-600 border-amber-200 bg-amber-50',
  PREPARING: 'text-blue-600 border-blue-200 bg-blue-50',
  READY: 'text-emerald-600 border-emerald-200 bg-emerald-50',
}

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

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length
  const totalCount = orders.length

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
          <span className="ml-1.5 text-sm">
            {sound ? t('staff.kds.soundOn') : t('staff.kds.soundOff')}
          </span>
        </Button>
      }
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-wrap gap-2">
          {COLUMNS.map((status) => (
            <span
              key={status}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium',
                COLUMN_COLOR[status]
              )}
            >
              {t(COLUMN_LABEL[status] ?? 'staff.kds.columnPending')}:{' '}
              <span className="font-semibold">
                {orders.filter((o) => o.status === status).length}
              </span>
            </span>
          ))}
        </div>
        {pendingCount > 0 && (
          <motion.span
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 animate-pulse"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" aria-hidden />
            {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
          </motion.span>
        )}
      </div>

      {loading ? (
        <LoadingState label={t('common.loading')} />
      ) : error ? (
        <ErrorState title={t('staff.error')} />
      ) : totalCount === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-6 text-slate-400">
            <Utensils className="h-10 w-10" aria-hidden />
          </div>
          <h3 className="font-playfair font-bold text-lg text-slate-900 mb-2">
            {t('staff.kds.emptyTitle')}
          </h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">{t('staff.kds.empty')}</p>
        </motion.div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {COLUMNS.map((status) => {
            const column = orders
              .filter((order) => order.status === status)
              .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

            return (
              <section key={status} aria-label={t(`order.status.${status}`)} className="space-y-3">
                <h2 className="flex items-center justify-between text-sm font-semibold uppercase tracking-wider text-slate-400">
                  {t(`order.status.${status}`)}
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                      COLUMN_COLOR[status]
                    )}
                  >
                    {column.length}
                  </span>
                </h2>

                <AnimatePresence mode="wait">
                  {column.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400"
                    >
                      {t('staff.kds.empty')}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-2"
                    >
                      {column.map((order) => (
                        <OrderTicket
                          key={order.id}
                          order={order}
                          busy={busyId === order.id}
                          busyItemId={busyItemId}
                          onAdvance={(next) => void advance(order, next)}
                          onAdvanceItem={(item, next) => void advanceItem(order, item, next)}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )
          })}
        </div>
      )}
    </StaffLayout>
  )
}
