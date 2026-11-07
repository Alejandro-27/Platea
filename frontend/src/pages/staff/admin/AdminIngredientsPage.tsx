import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { StaffLayout } from '@/components/staff/StaffLayout'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input } from '@/components/ui/Form'
import { useAsync } from '@/hooks/useAsync'
import { createIngredient, deleteIngredient, listIngredients, updateIngredient } from '@/lib/staff'
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
  const [error, setError] = useState(false)

  const close = () => setEditing(null)

  const openNew = () => {
    setEditing('new')
    setName('')
    setUnit('unidad')
    setCurrentStock('0')
    setMinStock('0')
    setCostPerUnit('')
    setError(false)
  }

  const openEdit = (ingredient: Ingredient) => {
    setEditing(ingredient)
    setName(ingredient.name)
    setUnit(ingredient.unit)
    setCurrentStock(String(Number(ingredient.currentStock)))
    setMinStock(String(Number(ingredient.minStock)))
    setCostPerUnit(ingredient.costPerUnit ? String(Number(ingredient.costPerUnit)) : '')
    setError(false)
  }

  const save = async () => {
    setSaving(true)
    setError(false)
    const payload = {
      name,
      unit,
      currentStock: Number(currentStock),
      minStock: Number(minStock),
      costPerUnit: costPerUnit.trim() === '' ? null : Number(costPerUnit),
    }

    try {
      if (editing === 'new') {
        await createIngredient({ ...payload, costPerUnit: payload.costPerUnit ?? undefined })
      } else if (editing) {
        await updateIngredient(editing.id, payload)
      }
      close()
      ingredients.reload()
    } catch {
      setError(true)
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
      setError(true)
    }
  }

  return (
    <StaffLayout
      title={t('staff.nav.ingredients')}
      actions={
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden />
          {t('staff.admin.create')}
        </Button>
      }
    >
      {ingredients.status === 'loading' ? (
        <LoadingState label={t('common.loading')} />
      ) : ingredients.status === 'error' ? (
        <ErrorState title={t('staff.error')} onRetry={ingredients.reload} />
      ) : ingredients.data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-muted">
          {t('staff.admin.empty')}
        </p>
      ) : (
        <ul className="space-y-2">
          {ingredients.data.map((ingredient) => {
            const low = Number(ingredient.currentStock) <= Number(ingredient.minStock)
            return (
              <li
                key={ingredient.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 p-3 shadow-card"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{ingredient.name}</p>
                  <p className={low ? 'text-xs font-medium text-rose-600' : 'text-xs text-muted'}>
                    {Number(ingredient.currentStock)} {ingredient.unit} ·{' '}
                    {t('staff.admin.ingredients.min', { value: Number(ingredient.minStock) })}
                    {low && ` · ${t('staff.admin.ingredients.lowStock')}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
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
              </li>
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
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              {t('staff.admin.cancel')}
            </Button>
            <Button onClick={() => void save()} disabled={saving || name.trim().length === 0}>
              {saving ? t('staff.admin.saving') : t('staff.admin.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
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
              {t('staff.error')}
            </p>
          )}
        </div>
      </Dialog>
    </StaffLayout>
  )
}
