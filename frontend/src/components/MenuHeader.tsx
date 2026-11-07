import { useTranslation } from 'react-i18next'
import { LanguageToggle } from '@/components/LanguageToggle'
import type { PublicTenant } from '@/types/api'

interface MenuHeaderProps {
  tenant: PublicTenant
  tableNumber?: number
}

export function MenuHeader({ tenant, tableNumber }: MenuHeaderProps) {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface-2">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        {tenant.logoUrl ? (
          <img
            src={tenant.logoUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand font-semibold text-brand-fg"
          >
            {tenant.name.slice(0, 1).toUpperCase()}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{tenant.name}</p>
          {tableNumber !== undefined && (
            <p className="text-xs text-muted">{t('menu.table', { number: tableNumber })}</p>
          )}
        </div>

        <LanguageToggle />
      </div>
    </header>
  )
}
