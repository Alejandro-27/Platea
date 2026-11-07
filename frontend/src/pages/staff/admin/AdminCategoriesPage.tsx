import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { StaffLayout } from '@/components/staff/StaffLayout'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Checkbox, Field, Input } from '@/components/ui/Form'
import { useAsync } from '@/hooks/useAsync'
import { createCategory, deleteCategory, listCategories, updateCategory } from '@/lib/staff'
import type { Category } from '@/types/api'

export default function AdminCategoriesPage() {
  const { t } = useTranslation()
  const categories = useAsync(listCategories, 'categories')
  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  const close = () => setEditing(null)

  const openNew = () => {
    setEditing('new')
    setName('')
    setSortOrder('0')
    setActive(true)
    setError(false)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setName(category.name)
    setSortOrder(String(category.sortOrder))
    setActive(category.isActive)
    setError(false)
  }

  const save = async () => {
    setSaving(true)
    setError(false)
    try {
      if (editing === 'new') {
        await createCategory({ name, sortOrder: Number(sortOrder), isActive: active })
      } else if (editing) {
        await updateCategory(editing.id, { name, sortOrder: Number(sortOrder), isActive: active })
      }
      close()
      categories.reload()
    } catch {
      setError(true)
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
      setError(true)
    }
  }

  return (
    <StaffLayout
      title={t('staff.nav.categories')}
      actions={
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden />
          {t('staff.admin.create')}
        </Button>
      }
    >
      {categories.status === 'loading' ? (
        <LoadingState label={t('common.loading')} />
      ) : categories.status === 'error' ? (
        <ErrorState title={t('staff.error')} onRetry={categories.reload} />
      ) : categories.data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-muted">
          {t('staff.admin.empty')}
        </p>
      ) : (
        <ul className="space-y-2">
          {categories.data.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 p-3 shadow-card"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {category.name}
                  {!category.isActive && (
                    <span className="ml-2 text-xs font-normal text-muted">
                      {t('staff.admin.inactive')}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted">
                  {category.slug} · {category._count?.dishes ?? 0}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
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
            </li>
          ))}
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
              {t('staff.error')}
            </p>
          )}
        </div>
      </Dialog>
    </StaffLayout>
  )
}
