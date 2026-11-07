import { Flame, Leaf, Star, WheatOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { QuantityStepper } from '@/components/QuantityStepper'
import { formatMoney, formatRating } from '@/lib/money'
import { useCart } from '@/store/cart'
import type { PublicDish } from '@/types/api'

interface DishCardProps {
  dish: PublicDish
}

export function DishCard({ dish }: DishCardProps) {
  const { t, i18n } = useTranslation()
  const line = useCart((state) => state.lines.find((item) => item.dishId === dish.id))
  const add = useCart((state) => state.add)
  const setQuantity = useCart((state) => state.setQuantity)

  return (
    <article className="flex gap-3 rounded-2xl bg-surface-2 p-3 shadow-card">
      {dish.imageUrl ? (
        <img
          src={dish.imageUrl}
          alt=""
          loading="lazy"
          className="h-24 w-24 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-surface text-2xl font-semibold text-muted"
        >
          {dish.name.slice(0, 1).toUpperCase()}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug">{dish.name}</h3>
          <span className="whitespace-nowrap font-semibold text-ink">
            {formatMoney(dish.price, i18n.language)}
          </span>
        </div>

        {dish.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">{dish.description}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {dish.isSpicy && (
            <span className="inline-flex items-center gap-1 text-rose-600">
              <Flame className="h-3.5 w-3.5" aria-hidden />
              {t('menu.spicy')}
            </span>
          )}
          {dish.isVegetarian && (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <Leaf className="h-3.5 w-3.5" aria-hidden />
              {t('menu.vegetarian')}
            </span>
          )}
          {dish.isGlutenFree && (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <WheatOff className="h-3.5 w-3.5" aria-hidden />
              {t('menu.glutenFree')}
            </span>
          )}
          {dish.allergens.length > 0 && (
            <span className="text-muted">
              {t('menu.allergens', { list: dish.allergens.join(', ') })}
            </span>
          )}
        </div>

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
