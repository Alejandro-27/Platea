import { useState } from 'react'
import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DishBadges } from '@/components/DishBadges'
import { QuantityStepper } from '@/components/QuantityStepper'
import { Button } from '@/components/ui/Button'
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
      footer={
        dish.isOutOfStock ? (
          <Button variant="secondary" onClick={onClose}>
            {t('common.close')}
          </Button>
        ) : (
          <>
            {line && (
              <QuantityStepper
                quantity={line.quantity}
                onChange={(quantity) => setQuantity(dish.id, quantity)}
              />
            )}
            <Button onClick={confirm}>{line ? t('common.done') : t('menu.add')}</Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        {dish.imageUrl && (
          <img src={dish.imageUrl} alt="" className="h-48 w-full rounded-xl object-cover" />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg font-semibold">{formatMoney(dish.price, i18n.language)}</p>
          {dish.reviewCount > 0 && (
            <span className="inline-flex items-center gap-1 text-sm text-muted">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
              {t('menu.rating', {
                rating: formatRating(dish.averageRating, i18n.language),
                reviews: dish.reviewCount,
              })}
            </span>
          )}
        </div>

        {dish.description && <p className="text-sm text-muted">{dish.description}</p>}

        <DishBadges dish={dish} />

        {dish.isOutOfStock ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {t('menu.outOfStock')}
          </p>
        ) : (
          <Field label={t('cart.itemNotes')}>
            <Textarea
              rows={2}
              value={notes}
              onChange={(event) => updateNotes(event.target.value)}
            />
          </Field>
        )}
      </div>
    </Dialog>
  )
}
