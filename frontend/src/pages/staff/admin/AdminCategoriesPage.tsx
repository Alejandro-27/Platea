import { useState } from 'react'
import { motion } from 'framer-motion'
import { List as ListIcon, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { StaffLayout } from '@/components/staff/StaffLayout'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Checkbox, Field, Input } from '@/components/ui/Form'
import { useAsync } from '@/hooks/useAsync'
import { createCategory, deleteCategory, listCategories, updateCategory } from '@/lib/staff'
import { categorySchema, validate } from '@/lib/schemas'
import type { Category } from '@/types/api'

export default function AdminCategoriesPage() {
  const { t } = useTranslation()
  const categories = useAsync(listCategories, 'categories')
  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => setEditing(null)

  const openNew = () => {
    setEditing('new')
    setName('')
    setSortOrder('0')
    setActive(true)
    setError(null)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setName(category.name)
    setSortOrder(String(category.sortOrder))
    setActive(category.isActive)
    setError(null)
  }

  const save = async () => {
    const payload = { name, sortOrder: Number(sortOrder) }
    const invalid = validate(categorySchema, payload)
    if (invalid) {
      setError(invalid)
      return
    }

    setSaving(true)
    setError(null)
    try {
      if (editing === 'new') {
        await createCategory({ ...payload, isActive: active })
      } else if (editing) {
        await updateCategory(editing.id, { ...payload, isActive: active })
      }
      close()
      categories.reload()
    } catch {
      setError('staff.error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (category: Category) => {
    if (!window.confirm(t('staff.admin.confirmDelete', { name: category.name }))) return
    try {
      await deleteCategory(category.id)
      categories.reload()
    } catch {
      setError('staff.error')
    }
  }

  return (
    <StaffLayout
      title={t('staff.nav.categories')}
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
      {categories.status === 'loading' ? (
        <LoadingState label={t('common.loading')} />
      ) : categories.status === 'error' ? (
        <ErrorState title={t('staff.error')} onRetry={categories.reload} />
      ) : categories.data.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-6 text-slate-400">
            <ListIcon className="h-10 w-10" aria-hidden />
          </div>
          <h3 className="font-playfair font-bold text-lg text-slate-900 mb-2">
            {t('staff.admin.empty')}
          </h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">Aún no hay categorías creadas.</p>
        </motion.div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.data.map((category) => (
            <motion.li
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * categories.data.indexOf(category) }}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-slate-900 truncate">{category.name}</p>
                  {!category.isActive && (
                    <span className="text-xs font-medium text-rose-600">
                      {t('staff.admin.inactive')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate">
                  {category.slug} · {category._count?.dishes ?? 0}{' '}
                  {t('staff.nav.dishes').toLowerCase()}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('staff.admin.edit')}
                  onClick={() => openEdit(category)}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('staff.admin.delete')}
                  onClick={() => void remove(category)}
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
          if (!open) close()
        }}
        title={editing === 'new' ? t('staff.admin.create') : t('staff.admin.edit')}
      >
        <div className="space-y-3 p-4">
          <Field label={t('staff.admin.categories.name')}>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label={t('staff.admin.categories.sortOrder')}>
            <Input
              type="number"
              inputMode="numeric"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            />
          </Field>
          <Checkbox
            label={t('staff.admin.categories.active')}
            checked={active}
            onChange={setActive}
          />
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
