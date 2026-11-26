import { motion } from 'framer-motion'
import { Star, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DishBadges } from '@/components/DishBadges'
import { formatMoney, formatRating } from '@/lib/money'
import { useCart } from '@/store/cart'
import type { PublicDish } from '@/types/api'

interface DishCardProps {
  dish: PublicDish
  onSelect: (dish: PublicDish) => void
}

export function DishCard({ dish, onSelect }: DishCardProps) {
  const { t, i18n } = useTranslation()
  const line = useCart((state) => state.lines.find((item) => item.dishId === dish.id))
  const add = useCart((state) => state.add)
  const setQuantity = useCart((state) => state.setQuantity)
  const inStock = !dish.isOutOfStock

  return (
    <motion.article
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="group relative rounded-2xl border border-line bg-white p-5 shadow-sm transition-all duration-200 ease-in-out"
    >
      {/* Imagen con aspect-ratio consistente */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-50">
        <button
          type="button"
          onClick={() => onSelect(dish)}
          aria-label={t('menu.details', { name: dish.name })}
          className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1"
          aria-hidden={!dish.imageUrl && !inStock ? 'true' : undefined}
        >
          {dish.imageUrl ? (
            <img
              src={dish.imageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400 text-xl font-semibold">
              {dish.name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </button>

        {!inStock && (
          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center rounded-xl">
            <span className="text-sm font-semibold text-white">{t('menu.outOfStock')}</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-ink leading-snug">
            <button
              type="button"
              onClick={() => onSelect(dish)}
              className="text-left hover:underline decoration-emerald-600/30 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              {dish.name}
            </button>
          </h3>
          <span className="whitespace-nowrap font-semibold text-emerald-600">
            {formatMoney(dish.price, i18n.language)}
          </span>
        </div>

        {dish.description && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-500 leading-relaxed">
            {dish.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {dish.reviewCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
              {t('menu.rating', {
                rating: formatRating(dish.averageRating, i18n.language),
                reviews: dish.reviewCount,
              })}
            </span>
          )}

          <DishBadges dish={dish} className="ml-auto" />
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          {inStock ? (
            line ? (
              <motion.div
                layoutId={`stepper-${dish.id}`}
                whileHover={{ scale: 1.02 }}
                className="inline-flex items-center rounded-xl border border-line bg-slate-50"
              >
                <button
                  type="button"
                  onClick={() => setQuantity(dish.id, line.quantity - 1)}
                  aria-label={t('common.decrease')}
                  className="flex h-10 w-10 items-center justify-center rounded-l-xl text-slate-600 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                >
                  <Plus className="h-3.5 w-3.5 rotate-90" aria-hidden />
                </button>
                <span
                  aria-live="polite"
                  className="min-w-8 text-center text-sm font-semibold text-ink"
                >
                  {line.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(dish.id, line.quantity + 1)}
                  aria-label={t('common.increase')}
                  className="flex h-10 w-10 items-center justify-center rounded-r-xl text-slate-600 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                </button>
              </motion.div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => add(dish)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                aria-label={t('menu.add')}
              >
                <Plus className="h-4 w-4" aria-hidden />
              </motion.button>
            )
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
              {t('menu.outOfStock')}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  )
}
