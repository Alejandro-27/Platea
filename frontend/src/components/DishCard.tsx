import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DishBadges } from '@/components/DishBadges'
import { Button } from '@/components/ui/Button'
import { QuantityStepper } from '@/components/QuantityStepper'
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

  return (
    <article className="flex gap-3 rounded-2xl bg-surface-2 p-3 shadow-card">
      <button
        type="button"
        onClick={() => onSelect(dish)}
        aria-label={t('menu.details', { name: dish.name })}
        className="shrink-0 self-start rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {dish.imageUrl ? (
          <img
            src={dish.imageUrl}
            alt=""
            loading="lazy"
            className="h-24 w-24 rounded-xl object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-24 w-24 items-center justify-center rounded-xl bg-surface text-2xl font-semibold text-muted"
          >
            {dish.name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug">
            <button
              type="button"
              onClick={() => onSelect(dish)}
              className="text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {dish.name}
            </button>
          </h3>
          <span className="whitespace-nowrap font-semibold text-ink">
            {formatMoney(dish.price, i18n.language)}
          </span>
        </div>

        {dish.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">{dish.description}</p>
        )}

        <DishBadges dish={dish} className="mt-2" />

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          {dish.reviewCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
              {t('menu.rating', {
                rating: formatRating(dish.averageRating, i18n.language),
                reviews: dish.reviewCount,
              })}
            </span>
          ) : (
            <span />
          )}

          {dish.isOutOfStock ? (
            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
              {t('menu.outOfStock')}
            </span>
          ) : line ? (
            <QuantityStepper
              quantity={line.quantity}
              onChange={(quantity) => setQuantity(dish.id, quantity)}
            />
          ) : (
            <Button size="sm" onClick={() => add(dish)}>
              {t('menu.add')}
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
