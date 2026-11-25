import { Flame, Leaf, WheatOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import type { PublicDish } from '@/types/api'

export function DishBadges({ dish, className }: { dish: PublicDish; className?: string }) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-xs', className)}>
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
  )
}
