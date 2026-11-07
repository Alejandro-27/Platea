import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from '@/components/LanguageToggle'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Form'
import { login } from '@/lib/api'
import { roleHome, useAuth } from '@/store/auth'

interface LocationState {
  from?: string
}

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const token = useAuth((state) => state.token)
  const role = useAuth((state) => state.user?.role)
  const setSession = useAuth((state) => state.setSession)
  const logout = useAuth((state) => state.logout)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [sending, setSending] = useState(false)

  const from = (location.state as LocationState | null)?.from

  // El panel de Super Admin no forma parte de esta consola.
  if (token && role === 'SUPER_ADMIN') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="max-w-sm text-muted">{t('staff.login.superAdmin')}</p>
        <Button variant="secondary" onClick={logout}>
          {t('staff.logout')}
        </Button>
      </div>
    )
  }

  if (token && role) {
    return <Navigate to={from ?? roleHome(role)} replace />
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSending(true)
    setError(false)

    try {
      const session = await login(email, password)
      setSession(session)
      navigate(from ?? roleHome(session.user.role), { replace: true })
    } catch {
      setError(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex justify-end p-4">
        <LanguageToggle />
      </div>

      <main className="flex flex-1 items-start justify-center px-4 pb-16">
        <form
          onSubmit={submit}
          className="w-full max-w-sm space-y-4 rounded-2xl bg-surface-2 p-5 shadow-card"
        >
          <div>
            <h1 className="text-xl font-semibold">{t('staff.login.title')}</h1>
            <p className="mt-1 text-sm text-muted">{t('staff.login.subtitle')}</p>
          </div>

          <Field label={t('staff.login.email')} htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>

          <Field label={t('staff.login.password')} htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          {error && (
            <p role="alert" className="flex items-center gap-2 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4" aria-hidden />
              {t('staff.login.error')}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={sending}>
            {sending ? t('staff.login.submitting') : t('staff.login.submit')}
          </Button>
        </form>
      </main>
    </div>
  )
}
