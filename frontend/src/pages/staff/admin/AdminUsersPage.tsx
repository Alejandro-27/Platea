import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Plus, Trash2, User as UserIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { StaffLayout } from '@/components/staff/StaffLayout'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Select } from '@/components/ui/Form'
import { useAsync } from '@/hooks/useAsync'
import { cn } from '@/lib/cn'
import { createUser, deleteUser, listUsers, updateUser } from '@/lib/staff'
import { userSchema, userUpdateSchema, validate } from '@/lib/schemas'
import type { StaffUser, UserRole } from '@/types/api'

const ROLES: UserRole[] = ['ADMIN', 'STAFF', 'KITCHEN']

const ROLE_KEY: Record<string, string> = {
  ADMIN: 'staff.admin.users.roleAdmin',
  STAFF: 'staff.admin.users.roleStaff',
  KITCHEN: 'staff.admin.users.roleKitchen',
}

const ROLE_COLOR: Partial<Record<UserRole, string>> = {
  ADMIN: 'bg-indigo-100 text-indigo-800',
  STAFF: 'bg-blue-100 text-blue-800',
  KITCHEN: 'bg-emerald-100 text-emerald-800',
}

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const users = useAsync(listUsers, 'users')
  const [editing, setEditing] = useState<StaffUser | 'new' | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('STAFF')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => setEditing(null)

  const openNew = () => {
    setEditing('new')
    setEmail('')
    setPassword('')
    setRole('STAFF')
    setError(null)
  }

  const openEdit = (user: StaffUser) => {
    setEditing(user)
    setEmail(user.email)
    setPassword('')
    setRole(user.role)
    setError(null)
  }

  const save = async () => {
    const cleanEmail = email.trim()
    const invalid =
      editing === 'new'
        ? validate(userSchema, { email: cleanEmail, password, role })
        : validate(userUpdateSchema, {
            email: cleanEmail,
            role,
            ...(password ? { password } : {}),
          })
    if (invalid) {
      setError(invalid)
      return
    }

    setSaving(true)
    setError(null)
    try {
      if (editing === 'new') {
        await createUser({ email: cleanEmail, password, role })
      } else if (editing) {
        await updateUser(editing.id, {
          email: cleanEmail,
          role,
          ...(password ? { password } : {}),
        })
      }
      close()
      users.reload()
    } catch {
      setError('staff.error')
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
      setError('staff.error')
    }
  }

  return (
    <StaffLayout
      title={t('staff.nav.users')}
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
      {users.status === 'loading' ? (
        <LoadingState label={t('common.loading')} />
      ) : users.status === 'error' ? (
        <ErrorState title={t('staff.error')} onRetry={users.reload} />
      ) : users.data.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-6 text-slate-400">
            <UserIcon className="h-10 w-10" aria-hidden />
          </div>
          <h3 className="font-playfair font-bold text-lg text-slate-900 mb-2">
            {t('staff.admin.empty')}
          </h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            Aún no hay usuarios registrados.
          </p>
        </motion.div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {users.data.map((user) => (
            <motion.li
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * users.data.indexOf(user) }}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-slate-900 truncate">{user.email}</p>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      ROLE_COLOR[user.role]
                    )}
                  >
                    {t(ROLE_KEY[user.role])}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
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
