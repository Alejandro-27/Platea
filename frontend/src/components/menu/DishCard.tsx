import { motion, useReducedMotion } from 'framer-motion'
import { Star, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DishBadges } from '@/components/DishBadges'
import { cn } from '@/lib/cn'
import { formatMoney, formatRating } from '@/lib/money'
import { useCart } from '@/store/cart'
import type { PublicDish } from '@/types/api'

interface DishCardProps {
  dish: PublicDish
  onSelect: (dish: PublicDish) => void
  layoutId?: string
}

export function DishCard({ dish, onSelect, layoutId }: DishCardProps) {
  const { t, i18n } = useTranslation()
  const reducedMotion = useReducedMotion()
  const line = useCart((state) => state.lines.find((item) => item.dishId === dish.id))
  const add = useCart((state) => state.add)
  const setQuantity = useCart((state) => state.setQuantity)
  const inStock = !dish.isOutOfStock

  const hover = reducedMotion ? {} : { y: -4 }
  const tap = reducedMotion ? {} : { scale: 0.98 }

  return (
    <motion.article
      whileHover={hover}
      whileTap={tap}
      className={cn(
        'group relative rounded-2xl border border-slate-200/60 bg-white p-5',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]',
        'hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)]',
        'hover:bg-slate-50',
        'transition-all duration-200 ease-in-out'
      )}
    >
      {/* Imagen con aspect-ratio 4/3 consistente */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-50">
        <button
          type="button"
          onClick={() => onSelect(dish)}
          aria-label={t('menu.details', { name: dish.name })}
          className={cn(
            'absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2',
            layoutId ? 'layout-image' : ''
          )}
          aria-hidden={!dish.imageUrl && !inStock ? 'true' : undefined}
        >
          {dish.imageUrl ? (
            <img
              src={dish.imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className={cn(
                'h-full w-full object-cover',
                reducedMotion
                  ? ''
                  : 'group-hover:scale-105 transition-transform duration-300 ease-in-out'
              )}
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
          <h3 className="font-semibold text-slate-900 leading-snug">
            <button
              type="button"
              onClick={() => onSelect(dish)}
              className="text-left hover:underline decoration-emerald-600/30 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              {dish.name}
            </button>
          </h3>
          <span className="whitespace-nowrap font-semibold text-emerald-600 tabular-nums">
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
                whileHover={{ scale: 1.02 }}
                className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50"
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
                  className="min-w-8 text-center text-sm font-semibold text-slate-900"
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
                whileHover={reducedMotion ? {} : { scale: 1.02 }}
                whileTap={reducedMotion ? {} : { scale: 0.96 }}
                onClick={() => add(dish)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
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
