import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useParams } from 'react-router-dom'
import { Check, ChevronLeft, Clock, Utensils, XCircle, ChefHat, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { LanguageToggle } from '@/components/LanguageToggle'
import { ApiError, getOrder } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatCents, formatMoney, formatTime, priceToCents } from '@/lib/money'
import { clearStoredSession, readStoredSession } from '@/lib/session'
import { createCustomerSocket } from '@/lib/socket'
import type { Order, OrderStatus } from '@/types/api'

const FLOW: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'SERVED']

const STATUS_ICON: Record<OrderStatus, React.ReactNode> = {
  PENDING: <Clock className="h-5 w-5" aria-hidden />,
  PREPARING: <ChefHat className="h-5 w-5" aria-hidden />,
  READY: <Check className="h-5 w-5" aria-hidden />,
  SERVED: <Utensils className="h-5 w-5" aria-hidden />,
  CANCELLED: <XCircle className="h-5 w-5" aria-hidden />,
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-50 border-amber-200 text-amber-700',
  PREPARING: 'bg-blue-50 border-blue-200 text-blue-700',
  READY: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  SERVED: 'bg-emerald-100 border-emerald-200 text-emerald-700',
  CANCELLED: 'bg-rose-50 border-rose-200 text-rose-700',
}

interface StatusStepProps {
  step: OrderStatus
  index: number
  currentIndex: number
  hint: string
}

function StatusStep({ step, index, currentIndex, hint }: StatusStepProps) {
  const { t } = useTranslation()
  const done = index <= currentIndex
  const isCurrent = index === currentIndex
  const isLast = index === FLOW.length - 1

  return (
    <motion.li
      key={step}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      className="flex items-start gap-3"
    >
      <div className="flex flex-col items-center">
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300',
            done
              ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-300',
            isCurrent && !done ? 'animate-pulse ring-2 ring-emerald-600/30' : ''
          )}
        >
          {done ? (
            <Check className="h-4 w-4" aria-hidden />
          ) : (
            <span className="text-xs font-semibold">{index + 1}</span>
          )}
        </span>
        {!isLast && (
          <span
            className={cn('w-px flex-1', index < currentIndex ? 'bg-emerald-600' : 'bg-slate-200')}
            aria-hidden
          />
        )}
      </div>
      <div className={cn('pb-4', !done && 'opacity-50')}>
        <p className="font-medium text-slate-900">{t(`order.status.${step}`)}</p>
        {isCurrent && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
      </div>
    </motion.li>
  )
}

export default function OrderStatusPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { t, i18n } = useTranslation()
  const [session] = useState(readStoredSession)
  const [order, setOrder] = useState<Order | null>(null)
  const [errorCode, setErrorCode] = useState<'session' | 'load' | null>(session ? null : 'session')
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!session || !orderId) return

    let active = true
    getOrder(session.id, orderId)
      .then((data) => {
        if (active) setOrder(data)
      })
      .catch((err) => {
        if (!active) return
        if (err instanceof ApiError && (err.status === 401 || err.status === 410)) {
          clearStoredSession()
          setErrorCode('session')
        } else {
          setErrorCode('load')
        }
      })

    return () => {
      active = false
    }
  }, [session, orderId])

  useEffect(() => {
    if (!session) return

    const socket = createCustomerSocket(session.id)
    const joinRooms = () => {
      setConnected(true)
      socket.emit('room:join', `session:${session.id}`)
      socket.emit('room:join', `table:${session.tableId}`)
    }
    const onDisconnect = () => setConnected(false)

    socket.on('connect', joinRooms)
    socket.on('disconnect', onDisconnect)
    socket.on('order:updated', (updated: Order) => {
      setOrder((current) => (current && updated.id === current.id ? updated : current))
    })
    if (socket.connected) joinRooms()

    return () => {
      socket.off()
      socket.disconnect()
    }
  }, [session])

  if (!session) {
    return <ErrorState title={t('order.sessionError')} />
  }

  if (errorCode === 'session') {
    return <ErrorState title={t('order.sessionError')} />
  }

  if (errorCode === 'load') {
    return <ErrorState title={t('order.loadError')} />
  }

  if (!order) {
    return <LoadingState label={t('common.loading')} />
  }

  const menuUrl = `/menu/${session.tenantId}?table=${session.tableId}`
  const cancelled = order.status === 'CANCELLED'
  const served = order.status === 'SERVED'
  const currentIndex = FLOW.indexOf(order.status)
  const hint = t(`order.statusHint.${order.status}` as const)

  return (
    <div className="min-h-dvh pb-16 bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link
            to={menuUrl}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            aria-label={t('order.backToMenu')}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-playfair font-bold text-xl text-slate-900 leading-tight">
              {t('order.title')}
            </h1>
            <p className="text-xs text-slate-400">
              {t('order.table', { number: session.tableNumber })}
            </p>
          </div>
          <LanguageToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        {/* Estado principal */}
        <AnimatePresence mode="wait">
          {cancelled ? (
            <motion.section
              key="cancelled"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 shrink-0">
                  <XCircle className="h-6 w-6 text-rose-600" aria-hidden />
                </div>
                <div>
                  <h2 className="font-playfair font-bold text-lg text-rose-800">
                    {t('order.status.CANCELLED')}
                  </h2>
                  <p className="mt-1 text-sm text-rose-600">{t('order.cancelled')}</p>
                </div>
              </div>
            </motion.section>
          ) : (
            <>
              <motion.section
                key="status"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-slate-400">
                      {t('order.placedAt', { time: formatTime(order.createdAt, i18n.language) })}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm',
                          STATUS_COLOR[order.status]
                        )}
                      >
                        {STATUS_ICON[order.status]}
                        {t(`order.status.${order.status}`)}
                      </span>
                      {served && (
                        <motion.span
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 3 }}
                          className="text-xs font-semibold text-emerald-600 flex items-center gap-1"
                        >
                          <Sparkles className="h-3.5 w-3.5" aria-hidden />
                          ¡Listo para disfrutar!
                        </motion.span>
                      )}
                    </div>
                  </div>
                </div>

                <ol className="flex flex-col gap-4">
                  {FLOW.map((step, index) => (
                    <StatusStep
                      key={step}
                      step={step}
                      index={index}
                      currentIndex={currentIndex}
                      hint={hint}
                    />
                  ))}
                </ol>
              </motion.section>

              {served && (
                <motion.section
                  key="celebration"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm text-center"
                >
                  <Sparkles
                    className="h-8 w-8 text-emerald-400 mx-auto mb-3 animate-pulse"
                    aria-hidden
                  />
                  <h2 className="font-playfair font-bold text-lg text-emerald-800 mb-1">
                    ¡Que lo disfrutes!
                  </h2>
                  <p className="text-sm text-emerald-600">
                    Tu pedido ha sido servido en la mesa {session.tableNumber}.
                  </p>
                </motion.section>
              )}
            </>
          )}
        </AnimatePresence>

        {/* Items del pedido */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair font-bold text-lg text-slate-900">{t('cart.title')}</h2>
            <span className="text-sm font-medium text-slate-600">
              {order.items.length} {order.items.length === 1 ? 'plato' : 'platos'}
            </span>
          </div>

          <ul className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <li key={item.id} className="py-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">
                    {item.quantity} × {item.dish.name}
                  </p>
                  {item.notes && (
                    <p className="mt-1 text-sm text-amber-700">
                      <span className="mr-1">📝</span>
                      {item.notes}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    {t(`order.itemStatus.${item.itemStatus}`)}
                  </p>
                </div>
                <span className="whitespace-nowrap font-semibold text-slate-700">
                  {formatCents(priceToCents(item.price) * item.quantity, i18n.language)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-slate-500">{t('order.total')}</span>
            <span className="font-playfair font-bold text-xl text-slate-900">
              {formatMoney(order.total, i18n.language)}
            </span>
          </div>

          {order.notes && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-sm font-semibold text-slate-900">{t('order.notes')}</p>
              <p className="mt-1 text-sm text-slate-500">{order.notes}</p>
            </div>
          )}
        </section>

        {/* Reconexión */}
        {!connected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-700"
            role="status"
          >
            <Clock className="h-3 w-3 animate-spin" aria-hidden />
            <span>{t('order.reconnecting')}</span>
          </motion.div>
        )}
      </main>
    </div>
  )
}
