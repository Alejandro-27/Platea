import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DishForm } from '@/components/admin/DishForm'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { StaffLayout } from '@/components/staff/StaffLayout'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Form'
import { useAsync } from '@/hooks/useAsync'
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
    <StaffLayout
      title={t('staff.nav.dishes')}
      actions={
        <Button onClick={() => setEditing('new')} disabled={!canCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          {t('staff.admin.create')}
        </Button>
      }
    >
      <div className="mb-3">
        <Input
          type="search"
          placeholder={t('menu.search')}
          aria-label={t('menu.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {!canCreate && !loading && !failed && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t('staff.admin.dishes.needCategory')}
        </p>
      )}

      {error && (
        <p role="alert" className="mb-3 text-sm text-rose-700">
          {t('staff.error')}
        </p>
      )}

      {loading ? (
        <LoadingState label={t('common.loading')} />
      ) : failed ? (
        <ErrorState title={t('staff.error')} onRetry={reloadAll} />
      ) : dishes.data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-muted">
          {t('staff.admin.empty')}
        </p>
      ) : (
        <ul className="space-y-2">
          {dishes.data.map((dish) => (
            <li
              key={dish.id}
              className="flex items-center gap-3 rounded-xl bg-surface-2 p-3 shadow-card"
            >
              {dish.imageUrl ? (
                <img
                  src={dish.imageUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface text-xs text-muted">
                  —
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {dish.name}
                  {!dish.isAvailable && (
                    <span className="ml-2 text-xs font-normal text-muted">
                      {t('staff.admin.inactive')}
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-muted">
                  {dish.category.name} · {formatMoney(dish.price, i18n.language)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void toggleStock(dish)}
                className={
                  dish.isOutOfStock
                    ? 'shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700'
                    : 'shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700'
                }
              >
                {dish.isOutOfStock ? t('menu.outOfStock') : t('staff.admin.dishes.inStock')}
              </button>

              <div className="flex shrink-0 gap-1">
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
            </li>
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
