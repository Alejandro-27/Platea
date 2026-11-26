import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Trash2, AlertCircle, Loader2, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
        <div className="space-y-3 border-t border-slate-100 px-6 pb-[calc(env(safe-area-inset-bottom)_+_1rem)] pt-4 sm:px-8">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">{t('cart.subtotal')}</span>
            <span className="font-playfair font-bold text-lg text-slate-900">
              {formatCents(totalCents, i18n.language)}
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={lines.length === 0 || sending}
            onClick={() => void submit()}
            className="w-full py-4 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            <span className="flex items-center justify-center gap-2">
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t('cart.sending')}
                </>
              ) : (
                <>
                  {t('cart.send')} <Send className="h-4 w-4" aria-hidden />
                </>
              )}
            </span>
          </motion.button>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        {lines.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4 text-slate-400">
              <Send className="h-7 w-7" aria-hidden />
            </div>
            <h3 className="font-playfair font-bold text-lg text-slate-900 mb-1">
              {t('cart.empty')}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Añade platos desde la carta para hacer tu pedido.
            </p>
          </motion.div>
        ) : (
          <>
            <motion.ul
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="divide-y divide-slate-100 px-6 sm:px-8"
            >
              {lines.map((line) => (
                <motion.li
                  key={line.dishId}
                  layoutId={`cart-item-${line.dishId}`}
                  className="py-4 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 shrink-0 text-slate-500 font-semibold text-sm">
                          {line.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 leading-tight">{line.name}</p>
                          {line.notes && (
                            <p className="mt-1 text-sm text-amber-700">
                              <span className="mr-1">📝</span>
                              {line.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setQuantity(line.dishId, 0)}
                        aria-label="Eliminar plato"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </motion.button>
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-2">
                      <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => setQuantity(line.dishId, line.quantity - 1)}
                          aria-label={t('common.decrease')}
                          className="flex h-9 w-9 items-center justify-center rounded-l-lg text-slate-600 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                        >
                          <span className="h-3.5 w-3.5 rotate-90" />
                        </button>
                        <span
                          aria-live="polite"
                          className="px-2 text-sm font-semibold text-slate-900"
                        >
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(line.dishId, line.quantity + 1)}
                          aria-label={t('common.increase')}
                          className="flex h-9 w-9 items-center justify-center rounded-r-lg text-slate-600 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                        >
                          <span className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-medium text-slate-700">
                        {formatCents(priceToCents(line.price) * line.quantity, i18n.language)}
                      </span>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={line.notes}
                    maxLength={300}
                    onChange={(event) => setNotes(line.dishId, event.target.value)}
                    placeholder={t('cart.itemNotes')}
                    aria-label={t('cart.itemNotesFor', { name: line.name })}
                    className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 transition-colors"
                  />
                </motion.li>
              ))}
            </motion.ul>

            <div className="mt-6 px-6 sm:px-8">
              <label
                htmlFor="order-notes"
                className="text-sm font-semibold text-slate-900 block mb-2"
              >
                {t('cart.orderNotes')}
              </label>
              <textarea
                id="order-notes"
                value={orderNotes}
                maxLength={1000}
                onChange={(event) => setOrderNotes(event.target.value)}
                placeholder={t('cart.orderNotesPlaceholder')}
                className="min-h-[100px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 transition-colors"
              />
            </div>

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 px-6 sm:px-8 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{t(`cart.error.${error}`)}</span>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </Sheet>
  )
}
