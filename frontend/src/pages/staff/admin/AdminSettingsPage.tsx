import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ErrorState, LoadingState } from '@/components/Feedback'
import { StaffLayout } from '@/components/staff/StaffLayout'
import { Field, Input } from '@/components/ui/Form'
import { useAsync } from '@/hooks/useAsync'
import { getTenantSettings, updateTenantSettings } from '@/lib/staff'
import { settingsSchema, validate } from '@/lib/schemas'
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
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    const payload = {
      name: name.trim(),
      logoUrl: logoUrl.trim() || null,
      primaryColor,
      secondaryColor: secondaryColor.trim() || null,
    }
    const invalid = validate(settingsSchema, payload)
    if (invalid) {
      setError(invalid)
      return
    }

    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await updateTenantSettings(payload)
      const tenant = useAuth.getState().tenant
      if (tenant) useAuth.setState({ tenant: { ...tenant, name: payload.name } })
      setSaved(true)
    } catch {
      setError('staff.error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg space-y-6"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label={t('staff.admin.settings.name')}>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </Field>

        <Field label={t('staff.admin.settings.logoUrl')}>
          <Input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t('staff.admin.settings.primaryColor')}>
            <div className="relative">
              <input
                type="color"
                aria-label={t('staff.admin.settings.primaryColor')}
                value={primaryColor}
                onChange={(event) => setPrimaryColor(event.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex h-11 w-full items-center justify-center rounded-lg border border-line bg-surface-2">
                <span className="relative z-10 text-xs font-medium text-slate-500">
                  {primaryColor}
                </span>
                <div
                  className="absolute left-1 top-1 h-8 w-8 rounded-full shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                  aria-hidden
                />
              </div>
            </div>
          </Field>
          <Field label={t('staff.admin.settings.secondaryColor')}>
            <div className="relative">
              <input
                type="color"
                aria-label={t('staff.admin.settings.secondaryColor')}
                value={secondaryColor || '#0f766e'}
                onChange={(event) => setSecondaryColor(event.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex h-11 w-full items-center justify-center rounded-lg border border-line bg-surface-2">
                <span className="relative z-10 text-xs font-medium text-slate-500">
                  {secondaryColor || '#0f766e'}
                </span>
                <div
                  className="absolute left-1 top-1 h-8 w-8 rounded-full shadow-sm"
                  style={{ backgroundColor: secondaryColor || '#0f766e' }}
                  aria-hidden
                />
              </div>
            </div>
          </Field>
        </div>

        {error && (
          <p role="alert" className="mt-2 text-sm text-rose-700">
            {t(error)}
          </p>
        )}
        {saved && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <Check className="h-4 w-4" aria-hidden />
            <span>{t('staff.admin.settings.saved')}</span>
          </div>
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => void save()}
        disabled={saving}
        className="w-full py-3.5 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none shadow-sm hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        {saving ? t('staff.admin.saving') : t('staff.admin.save')}
      </motion.button>
    </motion.div>
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
