import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

export function Sheet({ open, onOpenChange, title, children, footer }: SheetProps) {
  const { t } = useTranslation()

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-3xl bg-surface-2 shadow-bar focus:outline-none"
        >
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-line" aria-hidden />
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label={t('common.close')}>
                <X className="h-5 w-5" aria-hidden />
              </Button>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
          {footer && (
            <div className="border-t border-line px-4 pb-[calc(env(safe-area-inset-bottom)_+_1rem)] pt-3">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
