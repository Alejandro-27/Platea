import { ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { formatCents } from '@/lib/money'

interface CartBarProps {
  count: number
  totalCents: number
  onOpen: () => void
}

export function CartBar({ count, totalCents, onOpen }: CartBarProps) {
  const { t, i18n } = useTranslation()

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface-2 px-4 pb-[calc(env(safe-area-inset-bottom)_+_0.75rem)] pt-3">
      <div className="mx-auto max-w-3xl">
        <Button size="lg" className="w-full justify-between" onClick={onOpen}>
          <span className="inline-flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" aria-hidden />
            {t('cart.items', { count })}
          </span>
          <span className="inline-flex items-center gap-2">
            {formatCents(totalCents, i18n.language)}
            <span className="text-sm font-normal opacity-90">{t('cart.view')}</span>
          </span>
        </Button>
      </div>
    </div>
  )
}
