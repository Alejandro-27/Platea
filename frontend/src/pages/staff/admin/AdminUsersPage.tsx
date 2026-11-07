import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { StaffLayout } from '@/components/staff/StaffLayout'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Select } from '@/components/ui/Form'
import { useAsync } from '@/hooks/useAsync'
import { createUser, deleteUser, listUsers, updateUser } from '@/lib/staff'
import type { StaffUser, UserRole } from '@/types/api'

const ROLES: UserRole[] = ['ADMIN', 'STAFF', 'KITCHEN']

const ROLE_KEY: Record<string, string> = {
  ADMIN: 'staff.admin.users.roleAdmin',
  STAFF: 'staff.admin.users.roleStaff',
  KITCHEN: 'staff.admin.users.roleKitchen',
}

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const users = useAsync(listUsers, 'users')
  const [editing, setEditing] = useState<StaffUser | 'new' | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('STAFF')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  const close = () => setEditing(null)

  const openNew = () => {
    setEditing('new')
    setEmail('')
    setPassword('')
    setRole('STAFF')
    setError(false)
  }

  const openEdit = (user: StaffUser) => {
    setEditing(user)
    setEmail(user.email)
    setPassword('')
    setRole(user.role)
    setError(false)
  }

  const save = async () => {
    setSaving(true)
    setError(false)
    try {
      if (editing === 'new') {
        await createUser({ email, password, role })
      } else if (editing) {
        await updateUser(editing.id, {
          email,
          role,
          ...(password.trim().length > 0 ? { password } : {}),
        })
      }
      close()
      users.reload()
    } catch {
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (user: StaffUser) => {
    if (!window.confirm(t('staff.admin.confirmDelete', { name: user.email }))) return
    try {
      await deleteUser(user.id)
      users.reload()
    } catch {
      setError(true)
    }
  }

  const canSave = email.trim().length > 0 && (password === '' || password.length >= 8)

  return (
    <StaffLayout
      title={t('staff.nav.users')}
      actions={
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden />
          {t('staff.admin.create')}
        </Button>
      }
    >
      {users.status === 'loading' ? (
        <LoadingState label={t('common.loading')} />
      ) : users.status === 'error' ? (
        <ErrorState title={t('staff.error')} onRetry={users.reload} />
      ) : users.data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-muted">
          {t('staff.admin.empty')}
        </p>
      ) : (
        <ul className="space-y-2">
          {users.data.map((user) => (
            <li
              key={user.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 p-3 shadow-card"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{user.email}</p>
                <p className="text-xs text-muted">{t(ROLE_KEY[user.role])}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('staff.admin.edit')}
                  onClick={() => openEdit(user)}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('staff.admin.delete')}
                  onClick={() => void remove(user)}
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
            <Button onClick={() => void save()} disabled={saving || !canSave}>
              {saving ? t('staff.admin.saving') : t('staff.admin.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label={t('staff.admin.users.email')}>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Field
            label={t('staff.admin.users.password')}
            hint={editing === 'new' ? undefined : t('staff.admin.users.passwordHint')}
          >
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <Field label={t('staff.admin.users.role')}>
            <Select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
              {ROLES.map((value) => (
                <option key={value} value={value}>
                  {t(ROLE_KEY[value])}
                </option>
              ))}
            </Select>
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
