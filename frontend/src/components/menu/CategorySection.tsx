import { motion, useReducedMotion } from 'framer-motion'
import { DishCard } from '@/components/menu/DishCard'
import type { PublicCategory, PublicDish } from '@/types/api'

interface CategorySectionProps {
  category: PublicCategory
  onSelect: (dish: PublicDish) => void
}

export function CategorySection({ category, onSelect }: CategorySectionProps) {
  const reducedMotion = useReducedMotion()

  const reveal = reducedMotion ? {} : { opacity: 1, clipPath: 'inset(0%)' }
  const initial = reducedMotion ? {} : { opacity: 0, clipPath: 'inset(5% 0 5% 0)' }

  return (
    <section aria-labelledby={`category-${category.id}`} className="mb-8">
      <motion.h2
        id={`category-${category.id}`}
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={reducedMotion ? {} : { once: true, margin: '-50px' }}
        transition={
          reducedMotion
            ? {}
            : {
                delay: 0.1,
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
              }
        }
        className="text-lg md:text-xl font-playfair font-bold text-slate-900 tracking-tight"
      >
        {category.name}
      </motion.h2>

      <motion.div
        initial={initial}
        whileInView={reveal}
        viewport={reducedMotion ? {} : { once: true, margin: '-50px' }}
        transition={
          reducedMotion
            ? {}
            : {
                delay: 0.2,
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
              }
        }
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {category.dishes.map((dish, i) => (
          <motion.div
            key={dish.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={reducedMotion ? {} : { once: true, margin: '-50px' }}
            transition={
              reducedMotion
                ? {}
                : {
                    delay: 0.05 * i,
                    duration: 0.4,
                    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                  }
            }
            className="flex flex-col"
          >
            <DishCard
              key={dish.id}
              dish={dish}
              onSelect={onSelect}
              layoutId={`dish-image-${dish.id}`}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
