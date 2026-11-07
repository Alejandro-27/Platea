import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { StaffLayout } from '@/components/staff/StaffLayout'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Form'
import { useAsync } from '@/hooks/useAsync'
import { getTenantSettings, updateTenantSettings } from '@/lib/staff'
import { useAuth } from '@/store/auth'
import type { TenantSettings } from '@/types/api'

function SettingsForm({ initial }: { initial: TenantSettings }) {
  const { t } = useTranslation()
  const [name, setName] = useState(initial.name)
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? '')
  const [primaryColor, setPrimaryColor] = useState(initial.primaryColor)
  const [secondaryColor, setSecondaryColor] = useState(initial.secondaryColor ?? '')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  const save = async () => {
    setSaving(true)
    setError(false)
    setSaved(false)
    try {
      await updateTenantSettings({
        name,
        logoUrl: logoUrl.trim() || null,
        primaryColor,
        secondaryColor: secondaryColor.trim() || null,
      })
      const tenant = useAuth.getState().tenant
      if (tenant) useAuth.setState({ tenant: { ...tenant, name } })
      setSaved(true)
    } catch {
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <Field label={t('staff.admin.settings.name')}>
        <Input value={name} onChange={(event) => setName(event.target.value)} />
      </Field>

      <Field label={t('staff.admin.settings.logoUrl')}>
        <Input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t('staff.admin.settings.primaryColor')}>
          <input
            type="color"
            aria-label={t('staff.admin.settings.primaryColor')}
            value={primaryColor}
            onChange={(event) => setPrimaryColor(event.target.value)}
            className="h-11 w-full rounded-lg border border-line bg-surface-2"
          />
        </Field>
        <Field label={t('staff.admin.settings.secondaryColor')}>
          <input
            type="color"
            aria-label={t('staff.admin.settings.secondaryColor')}
            value={secondaryColor || '#0f766e'}
            onChange={(event) => setSecondaryColor(event.target.value)}
            className="h-11 w-full rounded-lg border border-line bg-surface-2"
          />
        </Field>
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {t('staff.error')}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-emerald-700">
          {t('staff.admin.settings.saved')}
        </p>
      )}

      <Button onClick={() => void save()} disabled={saving || name.trim().length < 2}>
        {saving ? t('staff.admin.saving') : t('staff.admin.save')}
      </Button>
    </div>
  )
}

export default function AdminSettingsPage() {
  const { t } = useTranslation()
  const settings = useAsync(getTenantSettings, 'settings')

  return (
    <StaffLayout title={t('staff.nav.settings')}>
      {settings.status === 'loading' ? (
        <LoadingState label={t('common.loading')} />
      ) : settings.status === 'error' ? (
        <ErrorState title={t('staff.error')} onRetry={settings.reload} />
      ) : (
        <SettingsForm initial={settings.data} />
      )}
    </StaffLayout>
  )
}
