import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { currentLocale } from '@/lib/money'
import { setLanguage } from '@/lib/i18n'
import type { Locale } from '@/types/api'

const LANGUAGES: Locale[] = ['es', 'en']

export function LanguageToggle() {
  const { t, i18n } = useTranslation()
  const active = currentLocale(i18n.language)

  return (
    <div
      role="group"
      aria-label={t('common.language')}
      className="inline-flex rounded-full border border-line bg-surface-2 p-0.5"
    >
      {LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          onClick={() => setLanguage(language)}
          aria-pressed={active === language}
          className={cn(
            'h-10 w-10 rounded-full px-2 text-xs font-semibold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
            active === language ? 'bg-brand text-brand-fg' : 'text-muted hover:text-ink'
          )}
        >
          {language}
        </button>
      ))}
    </div>
  )
}
