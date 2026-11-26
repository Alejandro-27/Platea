import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Plus, Table as TableIcon, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DishForm } from '@/components/admin/DishForm'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { StaffLayout } from '@/components/staff/StaffLayout'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Form'
import { useAsync } from '@/hooks/useAsync'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/money'
import { deleteDish, listCategories, listDishes, listIngredients, updateDish } from '@/lib/staff'
import type { AdminDish } from '@/types/api'

export default function AdminDishesPage() {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState('')
  const dishes = useAsync(() => listDishes({ search: search || undefined }), `dishes:${search}`)
  const categories = useAsync(listCategories, 'dishes-categories')
  const ingredients = useAsync(listIngredients, 'dishes-ingredients')
  const [editing, setEditing] = useState<AdminDish | 'new' | null>(null)
  const [error, setError] = useState(false)

  const categoriesList = categories.status === 'ready' ? categories.data : []
  const ingredientsList = ingredients.status === 'ready' ? ingredients.data : []
  const loading =
    dishes.status === 'loading' ||
    categories.status === 'loading' ||
    ingredients.status === 'loading'
  const failed =
    dishes.status === 'error' || categories.status === 'error' || ingredients.status === 'error'
  const canCreate = categoriesList.length > 0

  const reloadAll = () => {
    dishes.reload()
    categories.reload()
    ingredients.reload()
  }

  const toggleStock = async (dish: AdminDish) => {
    try {
      await updateDish(dish.id, { isOutOfStock: !dish.isOutOfStock })
      dishes.reload()
    } catch {
      setError(true)
    }
  }

  const remove = async (dish: AdminDish) => {
    if (!window.confirm(t('staff.admin.confirmDelete', { name: dish.name }))) return
    try {
      await deleteDish(dish.id)
      dishes.reload()
    } catch {
      setError(true)
    }
  }

  return (
    <StaffLayout title={t('staff.nav.dishes')}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Input
            type="search"
            placeholder={t('menu.search')}
            aria-label={t('menu.search')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 w-full pl-9"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setEditing('new')}
          disabled={!canCreate}
          className="flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none shadow-sm hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t('staff.admin.create')}
        </motion.button>
      </div>

      {!canCreate && !loading && !failed && (
        <p className="mb-4 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t('staff.admin.dishes.needCategory')}
        </p>
      )}

      {error && (
        <p role="alert" className="mb-4 text-sm text-rose-700">
          {t('staff.error')}
        </p>
      )}

      {loading ? (
        <LoadingState label={t('common.loading')} />
      ) : failed ? (
        <ErrorState title={t('staff.error')} onRetry={reloadAll} />
      ) : dishes.data.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-6 text-slate-400">
            <TableIcon className="h-10 w-10" aria-hidden />
          </div>
          <h3 className="font-playfair font-bold text-lg text-slate-900 mb-2">
            {t('staff.admin.empty')}
          </h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">Aún no hay platos en la carta.</p>
        </motion.div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dishes.data.map((dish) => (
            <motion.li
              key={dish.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * dishes.data.indexOf(dish) }}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
            >
              <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-50 mb-3">
                {dish.imageUrl ? (
                  <img
                    src={dish.imageUrl}
                    alt=""
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400 text-xl font-semibold">
                    {dish.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                {!dish.isAvailable && (
                  <span className="absolute top-2 right-2 flex h-6 items-center gap-1 rounded-full bg-rose-500 px-1.5 text-xs font-semibold text-white">
                    <span className="h-2 w-2 rounded-full bg-white" aria-hidden />
                    {t('staff.admin.inactive')}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{dish.name}</p>
                <p className="mt-0.5 text-xs text-slate-400 truncate">
                  {dish.category.name} · {formatMoney(dish.price, i18n.language)}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void toggleStock(dish)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm',
                    dish.isOutOfStock
                      ? 'border border-rose-100 bg-rose-50 text-rose-700'
                      : 'border border-emerald-100 bg-emerald-50 text-emerald-700'
                  )}
                >
                  {dish.isOutOfStock ? t('menu.outOfStock') : t('staff.admin.dishes.inStock')}
                </button>
              </div>

              <div className="mt-auto flex items-center justify-between gap-2 pt-4 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('staff.admin.edit')}
                  onClick={() => setEditing(dish)}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('staff.admin.delete')}
                  onClick={() => void remove(dish)}
                >
                  <Trash2 className="h-4 w-4 text-rose-600" aria-hidden />
                </Button>
              </div>
            </motion.li>
          ))}
        </ul>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        title={editing === 'new' ? t('staff.admin.create') : t('staff.admin.edit')}
      >
        {editing !== null && (
          <DishForm
            dish={editing === 'new' ? undefined : editing}
            categories={categoriesList}
            ingredients={ingredientsList}
            onDone={() => {
              setEditing(null)
              reloadAll()
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Dialog>
    </StaffLayout>
  )
}
