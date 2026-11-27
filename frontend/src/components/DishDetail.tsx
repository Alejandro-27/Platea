import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Plus, Minus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DishBadges } from '@/components/DishBadges'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Textarea } from '@/components/ui/Form'
import { formatMoney, formatRating } from '@/lib/money'
import { useCart } from '@/store/cart'
import type { PublicDish } from '@/types/api'

interface DishDetailProps {
  dish: PublicDish
  onClose: () => void
}

export function DishDetail({ dish, onClose }: DishDetailProps) {
  const { t, i18n } = useTranslation()
  const line = useCart((state) => state.lines.find((item) => item.dishId === dish.id))
  const add = useCart((state) => state.add)
  const setQuantity = useCart((state) => state.setQuantity)
  const setLineNotes = useCart((state) => state.setNotes)
  const inStock = !dish.isOutOfStock
  const [notes, setNotes] = useState(line?.notes ?? '')

  const updateNotes = (value: string) => {
    setNotes(value)
    if (line) setLineNotes(dish.id, value)
  }

  const confirm = () => {
    if (!line) add(dish)
    setLineNotes(dish.id, notes)
    onClose()
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={dish.name}
    >
      <div className="space-y-6 p-6 rounded-3xl shadow-xl border border-line">
        {/* Imagen grande con morphing */}
        {dish.imageUrl ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-video overflow-hidden rounded-xl bg-slate-50 mx-auto max-w-[520px] shadow-lg"
          >
            <img
              src={dish.imageUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
            />
          </motion.div>
        ) : (
          <div className="aspect-video rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-4xl font-semibold mx-auto max-w-[520px]">
            {dish.name.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {formatMoney(dish.price, i18n.language)}
            </p>
            {dish.reviewCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                {t('menu.rating', {
                  rating: formatRating(dish.averageRating, i18n.language),
                  reviews: dish.reviewCount,
                })}
              </span>
            )}
          </div>
          <DishBadges dish={dish} className="ml-auto" />
        </div>

        {dish.description && (
          <p className="text-sm text-slate-500 leading-relaxed">{dish.description}</p>
        )}

        {inStock ? (
          <>
            <Field label={t('cart.itemNotesFor', { name: dish.name })}>
              <Textarea
                rows={3}
                value={notes}
                onChange={(event) => updateNotes(event.target.value)}
                placeholder={t('cart.itemNotes')}
                className="h-24"
              />
            </Field>

            <div className="flex items-center justify-between gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="inline-flex items-center rounded-xl border border-line bg-slate-50"
              >
                <button
                  type="button"
                  onClick={() => setQuantity(dish.id, (line?.quantity ?? 1) - 1)}
                  aria-label={t('common.decrease')}
                  className="flex h-11 w-11 items-center justify-center rounded-l-xl text-slate-600 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                >
                  <Minus className="h-4 w-4" aria-hidden />
                </button>
                <span
                  aria-live="polite"
                  className="min-w-8 text-center text-sm font-semibold text-slate-900"
                >
                  {line?.quantity ?? 1}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(dish.id, (line?.quantity ?? 1) + 1)}
                  aria-label={t('common.increase')}
                  className="flex h-11 w-11 items-center justify-center rounded-r-xl text-slate-600 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </button>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={confirm}
                disabled={!inStock}
                className="flex-1 px-6 py-3.5 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                {line ? t('common.done') : t('menu.add')}
              </motion.button>
            </div>
          </>
        ) : (
          <p className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
            {t('menu.outOfStock')}
          </p>
        )}
      </div>
    </Dialog>
  )
}
