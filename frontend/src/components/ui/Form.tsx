import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/cn'

const fieldClass =
  'w-full rounded-lg border border-line bg-surface-2 px-3 text-base text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50'

interface FieldProps {
  label: string
  htmlFor?: string
  hint?: string
  children: ReactNode
  className?: string
}

export function Field({ label, htmlFor, hint, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {/* La etiqueta envuelve el control para asociarse sin exigir ids únicos. */}
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        <span className="mb-1 block">{label}</span>
        {children}
      </label>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(fieldClass, 'h-11', className)} {...props} />
  }
)

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(fieldClass, 'py-2', className)} {...props} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return <select ref={ref} className={cn(fieldClass, 'h-11', className)} {...props} />
  }
)

interface CheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 rounded border-line accent-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      />
      {label}
    </label>
  )
}
