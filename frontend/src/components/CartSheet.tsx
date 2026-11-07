import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { QuantityStepper } from '@/components/QuantityStepper'
import { Sheet } from '@/components/ui/Sheet'
import { ApiError, createOrder } from '@/lib/api'
import { formatCents, priceToCents } from '@/lib/money'
import { clearStoredSession } from '@/lib/session'
import { useCart } from '@/store/cart'

type SubmitError = 'outOfStock' | 'session' | 'generic'

interface CartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
}

export function CartSheet({ open, onOpenChange, sessionId }: CartSheetProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const lines = useCart((state) => state.lines)
  const orderNotes = useCart((state) => state.orderNotes)
  const setQuantity = useCart((state) => state.setQuantity)
  const setNotes = useCart((state) => state.setNotes)
  const setOrderNotes = useCart((state) => state.setOrderNotes)
  const clear = useCart((state) => state.clear)

  const [sending, setSending] = useState(false)
  const [error, setError] = useState<SubmitError | null>(null)

  const totalCents = lines.reduce((sum, line) => sum + priceToCents(line.price) * line.quantity, 0)

  const submit = async () => {
    if (lines.length === 0 || sending) return
    setSending(true)
    setError(null)

    try {
      const order = await createOrder(sessionId, {
        items: lines.map((line) => ({
          dishId: line.dishId,
          quantity: line.quantity,
          notes: line.notes.trim() || undefined,
        })),
        notes: orderNotes.trim() || undefined,
      })
      clear()
      onOpenChange(false)
      navigate(`/order/${order.id}`)
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'INTERNAL_ERROR'
      if (code === 'DISH_OUT_OF_STOCK') {
        setError('outOfStock')
      } else if (code === 'SESSION_EXPIRED' || code === 'UNAUTHORIZED') {
        clearStoredSession()
        setError('session')
      } else {
        setError('generic')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('cart.title')}
      footer={
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">{t('cart.subtotal')}</span>
            <span className="text-base font-semibold">
              {formatCents(totalCents, i18n.language)}
            </span>
          </div>
          <Button
            size="lg"
            className="w-full"
            onClick={() => void submit()}
            disabled={lines.length === 0 || sending}
          >
            {sending ? t('cart.sending') : t('cart.send')}
          </Button>
        </div>
      }
    >
      {lines.length === 0 ? (
        <p className="py-10 text-center text-muted">{t('cart.empty')}</p>
      ) : (
        <>
          <ul className="divide-y divide-line">
            {lines.map((line) => (
              <li key={line.dishId} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{line.name}</p>
                    <p className="text-sm text-muted">
                      {formatCents(priceToCents(line.price) * line.quantity, i18n.language)}
                    </p>
                  </div>
                  <QuantityStepper
                    quantity={line.quantity}
                    onChange={(quantity) => setQuantity(line.dishId, quantity)}
                  />
                </div>
                <input
                  type="text"
                  value={line.notes}
                  maxLength={300}
                  onChange={(event) => setNotes(line.dishId, event.target.value)}
                  placeholder={t('cart.itemNotes')}
                  aria-label={t('cart.itemNotesFor', { name: line.name })}
                  className="mt-2 h-10 w-full rounded-lg border border-line bg-surface px-3 text-base placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                />
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <label htmlFor="order-notes" className="text-sm font-medium">
              {t('cart.orderNotes')}
            </label>
            <textarea
              id="order-notes"
              value={orderNotes}
              maxLength={1000}
              onChange={(event) => setOrderNotes(event.target.value)}
              placeholder={t('cart.orderNotesPlaceholder')}
              className="mt-1 min-h-20 w-full rounded-lg border border-line bg-surface px-3 py-2 text-base placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {t(`cart.error.${error}`)}
            </p>
          )}
        </>
      )}
    </Sheet>
  )
}
