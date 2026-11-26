import { motion } from 'framer-motion'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCents } from '@/lib/money'

interface CartBarProps {
  count: number
  totalCents: number
  onOpen: () => void
}

export function CartBar({ count, totalCents, onOpen }: CartBarProps) {
  const { t, i18n } = useTranslation()

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/60 bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60 px-4 pb-[calc(env(safe-area-inset-bottom)_+_1rem)] pt-3.5 shadow-xl"
    >
      <div className="mx-auto max-w-3xl">
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          whileFocus={{ scale: 0.97 }}
          className="w-full justify-between rounded-2xl border border-emerald-100 bg-emerald-600 text-white shadow-lg hover:shadow-xl hover:bg-emerald-700 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          onClick={onOpen}
        >
          <span className="inline-flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" aria-hidden />
            <span className="font-semibold">{t('cart.items', { count })}</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="font-semibold">{formatCents(totalCents, i18n.language)}</span>
            <span className="text-sm font-medium opacity-90">{t('cart.view')}</span>
            <ArrowRight className="h-4 w-4 ml-1" aria-hidden />
          </span>
        </motion.button>
      </div>
    </motion.div>
  )
}
