import { motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { PublicTenant } from '@/types/api'

interface RestaurantHeroProps {
  tenant: PublicTenant
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.1,
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
} as const

const letterVariant = {
  hidden: { opacity: 0, y: '100%' },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
  },
} as const

export function RestaurantHero({ tenant }: RestaurantHeroProps) {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-slate-50 p-0 mb-8 shadow-sm">
      {/* Parallax background layer */}
      <motion.div
        className="absolute inset-0 z-0 bg-slate-100"
        initial={reducedMotion ? {} : { y: 0 }}
        animate={reducedMotion ? {} : { y: [0, -40, 0] }}
        transition={reducedMotion ? {} : { repeat: Infinity, duration: 10, ease: 'linear' }}
      />

      {/* Subtle depth gradient */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-white/60 to-white" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center px-6 py-12 md:px-12 md:py-16 text-center">
        <motion.div
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reducedMotion ? {} : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-2xl font-bold" aria-hidden>
            {tenant.name.slice(0, 1).toUpperCase()}
          </span>
        </motion.div>

        <motion.h1
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="font-playfair font-bold text-3xl md:text-5xl lg:text-6xl text-slate-900 tracking-tight leading-[1.1] mb-2"
        >
          {tenant.name.split('').map((letter, i) => (
            <motion.span key={i} variants={letterVariant} className="inline-block">
              {letter === ' ' ? '\u00A0' : letter}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reducedMotion ? {} : { delay: 0.4, duration: 0.5, ease: 'easeOut' }}
          className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto"
        >
          {t('menu.restaurantDescription', { name: tenant.name })}
        </motion.p>
      </div>
    </section>
  )
}
