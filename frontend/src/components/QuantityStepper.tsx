import { Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface QuantityStepperProps {
  quantity: number
  onChange: (quantity: number) => void
}

export function QuantityStepper({ quantity, onChange }: QuantityStepperProps) {
  const { t } = useTranslation()

  return (
    <div className="inline-flex items-center rounded-xl border border-line bg-surface-2">
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        aria-label={t('common.decrease')}
        className="flex h-10 w-10 items-center justify-center rounded-l-xl text-ink hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      <span aria-live="polite" className="min-w-8 text-center text-sm font-semibold">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        aria-label={t('common.increase')}
        className="flex h-10 w-10 items-center justify-center rounded-r-xl text-ink hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}
