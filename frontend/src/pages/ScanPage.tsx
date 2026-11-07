import { QrCode } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from '@/components/LanguageToggle'

export function ScanPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex justify-end p-4">
        <LanguageToggle />
      </div>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-brand-fg">
          <QrCode className="h-8 w-8" aria-hidden />
        </span>
        <h1 className="text-xl font-semibold">{t('scan.title')}</h1>
        <p className="max-w-sm text-muted">{t('scan.message')}</p>
      </main>
    </div>
  )
}
