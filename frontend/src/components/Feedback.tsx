import { AlertCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/Button'

export function LoadingState({ label }: { label: string }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-16 text-muted">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  )
}

interface ErrorStateProps {
  title: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation()

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <AlertCircle className="h-8 w-8 text-rose-500" aria-hidden />
      <div>
        <p className="font-semibold">{title}</p>
        {message && <p className="mt-1 text-sm text-muted">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}
