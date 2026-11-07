import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, ChevronLeft, XCircle } from 'lucide-react'
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

function StatusTimeline({ status }: { status: OrderStatus }) {
  const { t } = useTranslation()
  const currentIndex = FLOW.indexOf(status)

  return (
    <ol>
      {FLOW.map((step, index) => {
        const done = index <= currentIndex
        const current = index === currentIndex

        return (
          <li key={step} className="flex gap-3" aria-current={current ? 'step' : undefined}>
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                  done
                    ? 'border-brand bg-brand text-brand-fg'
                    : 'border-line bg-surface-2 text-muted'
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </span>
              {index < FLOW.length - 1 && (
                <span
                  className={cn('w-0.5 flex-1', index < currentIndex ? 'bg-brand' : 'bg-line')}
                  aria-hidden
                />
              )}
            </div>
            <div className={cn('pb-5', !done && 'opacity-60')}>
              <p className="font-medium">{t(`order.status.${step}`)}</p>
              {current && <p className="text-sm text-muted">{t(`order.statusHint.${step}`)}</p>}
            </div>
          </li>
        )
      })}
    </ol>
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

  return (
    <div className="min-h-dvh pb-10">
      <header className="border-b border-line bg-surface-2">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link
            to={menuUrl}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label={t('order.backToMenu')}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-semibold leading-tight">{t('order.title')}</h1>
            <p className="text-xs text-muted">
              {t('order.table', { number: session.tableNumber })}
            </p>
          </div>
          <LanguageToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-4">
        <section className="rounded-2xl bg-surface-2 p-4 shadow-card">
          {!connected && (
            <p role="status" className="mb-2 text-xs text-amber-700">
              {t('order.reconnecting')}
            </p>
          )}

          {cancelled ? (
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-rose-600" aria-hidden />
              <div>
                <p className="font-semibold text-rose-700">{t('order.status.CANCELLED')}</p>
                <p className="mt-1 text-sm text-muted">{t('order.cancelled')}</p>
              </div>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted">
                {t('order.placedAt', { time: formatTime(order.createdAt, i18n.language) })}
              </p>
              <StatusTimeline status={order.status} />
            </>
          )}
        </section>

        <section className="rounded-2xl bg-surface-2 p-4 shadow-card">
          <ul className="divide-y divide-line">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {item.quantity} × {item.dish.name}
                  </p>
                  {item.notes && <p className="text-sm text-muted">{item.notes}</p>}
                  <p className="mt-0.5 text-xs text-muted">
                    {t(`order.itemStatus.${item.itemStatus}`)}
                  </p>
                </div>
                <span className="whitespace-nowrap font-medium">
                  {formatCents(priceToCents(item.price) * item.quantity, i18n.language)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <span className="text-muted">{t('order.total')}</span>
            <span className="text-lg font-semibold">{formatMoney(order.total, i18n.language)}</span>
          </div>

          {order.notes && (
            <div className="mt-3 border-t border-line pt-3">
              <p className="text-sm font-medium">{t('order.notes')}</p>
              <p className="text-sm text-muted">{order.notes}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
