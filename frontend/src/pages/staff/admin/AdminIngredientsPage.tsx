import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Plus, Package as PackageIcon, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { StaffLayout } from '@/components/staff/StaffLayout'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input } from '@/components/ui/Form'
import { useAsync } from '@/hooks/useAsync'
import { cn } from '@/lib/cn'
import { createIngredient, deleteIngredient, listIngredients, updateIngredient } from '@/lib/staff'
import { ingredientSchema, validate } from '@/lib/schemas'
import type { Ingredient } from '@/types/api'

export default function AdminIngredientsPage() {
  const { t } = useTranslation()
  const ingredients = useAsync(listIngredients, 'ingredients')
  const [editing, setEditing] = useState<Ingredient | 'new' | null>(null)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('unidad')
  const [currentStock, setCurrentStock] = useState('0')
  const [minStock, setMinStock] = useState('0')
  const [costPerUnit, setCostPerUnit] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => setEditing(null)

  const openNew = () => {
    setEditing('new')
    setName('')
    setUnit('unidad')
    setCurrentStock('0')
    setMinStock('0')
    setCostPerUnit('')
    setError(null)
  }

  const openEdit = (ingredient: Ingredient) => {
    setEditing(ingredient)
    setName(ingredient.name)
    setUnit(ingredient.unit)
    setCurrentStock(String(Number(ingredient.currentStock)))
    setMinStock(String(Number(ingredient.minStock)))
    setCostPerUnit(ingredient.costPerUnit ? String(Number(ingredient.costPerUnit)) : '')
    setError(null)
  }

  const save = async () => {
    const payload = {
      name,
      unit,
      currentStock: Number(currentStock),
      minStock: Number(minStock),
      costPerUnit: costPerUnit.trim() === '' ? null : Number(costPerUnit),
    }
    const invalid = validate(ingredientSchema, payload)
    if (invalid) {
      setError(invalid)
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (editing === 'new') {
        await createIngredient({ ...payload, costPerUnit: payload.costPerUnit ?? undefined })
      } else if (editing) {
        await updateIngredient(editing.id, payload)
      }
      close()
      ingredients.reload()
    } catch {
      setError('staff.error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (ingredient: Ingredient) => {
    if (!window.confirm(t('staff.admin.confirmDelete', { name: ingredient.name }))) return
    try {
      await deleteIngredient(ingredient.id)
      ingredients.reload()
    } catch {
      setError('staff.error')
    }
  }

  return (
    <StaffLayout
      title={t('staff.nav.ingredients')}
      actions={
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t('staff.admin.create')}
        </motion.button>
      }
    >
      {ingredients.status === 'loading' ? (
        <LoadingState label={t('common.loading')} />
      ) : ingredients.status === 'error' ? (
        <ErrorState title={t('staff.error')} onRetry={ingredients.reload} />
      ) : ingredients.data.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-6 text-slate-400">
            <PackageIcon className="h-10 w-10" aria-hidden />
          </div>
          <h3 className="font-playfair font-bold text-lg text-slate-900 mb-2">
            {t('staff.admin.empty')}
          </h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            Aún no hay ingredientes registrados.
          </p>
        </motion.div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ingredients.data.map((ingredient) => {
            const low = Number(ingredient.currentStock) <= Number(ingredient.minStock)
            return (
              <motion.li
                key={ingredient.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * ingredients.data.indexOf(ingredient) }}
                className={cn(
                  'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col',
                  low ? 'border-amber-100 bg-amber-50' : ''
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-slate-900 truncate">{ingredient.name}</p>
                    {low && (
                      <span className="text-xs font-medium text-rose-600">
                        {t('staff.admin.ingredients.lowStock')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {Number(ingredient.currentStock)} {ingredient.unit} ·{' '}
                    {t('staff.admin.ingredients.min', { value: Number(ingredient.minStock) })}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('staff.admin.edit')}
                    onClick={() => openEdit(ingredient)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('staff.admin.delete')}
                    onClick={() => void remove(ingredient)}
                  >
                    <Trash2 className="h-4 w-4 text-rose-600" aria-hidden />
                  </Button>
                </div>
              </motion.li>
            )
          })}
        </ul>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) close()
        }}
        title={editing === 'new' ? t('staff.admin.create') : t('staff.admin.edit')}
      >
        <div className="space-y-3 p-4">
          <Field label={t('staff.admin.ingredients.name')}>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label={t('staff.admin.ingredients.unit')}>
            <Input value={unit} onChange={(event) => setUnit(event.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('staff.admin.ingredients.stock')}>
              <Input
                type="number"
                step="0.01"
                value={currentStock}
                onChange={(event) => setCurrentStock(event.target.value)}
              />
            </Field>
            <Field label={t('staff.admin.ingredients.minStock')}>
              <Input
                type="number"
                step="0.01"
                value={minStock}
                onChange={(event) => setMinStock(event.target.value)}
              />
            </Field>
          </div>
          <Field label={t('staff.admin.ingredients.cost')}>
            <Input
              type="number"
              step="0.01"
              value={costPerUnit}
              onChange={(event) => setCostPerUnit(event.target.value)}
            />
          </Field>
          {error && (
            <p role="alert" className="text-sm text-rose-700">
              {t(error)}
            </p>
          )}
        </div>
        <div className="border-t border-slate-100 px-4 py-3 flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            {t('staff.admin.cancel')}
          </Button>
          <Button
            onClick={() => void save()}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? t('staff.admin.saving') : t('staff.admin.save')}
          </Button>
        </div>
      </Dialog>
    </StaffLayout>
  )
}
