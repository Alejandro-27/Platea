// Platea — Sistema de diseño centralizado
// Constantes para mantener consistencia visual en toda la aplicación.
// Todas las valeurs siguen el grid de 8px y la jerarquía de radios estricta.

// ┌─────────────────────────────────────────────────────────────────────┐
// │ Colores                                                             │
// └─────────────────────────────────────────────────────────────────────┘
export const colors = {
  primary: 'emerald-600',
  primaryHover: 'emerald-700',
  background: 'white',
  surface: 'white',
  surfaceHover: 'slate-50',
  border: 'slate-200/60',
  textPrimary: 'slate-900',
  textSecondary: 'slate-500',
  textMuted: 'slate-400',
  success: 'emerald-500',
  warning: 'amber-500',
  error: 'red-500',
  info: 'blue-500',
} as const

// ┌─────────────────────────────────────────────────────────────────────┐
// │ Radios (jerarquía estricta — NUNCA mezclar en el mismo nivel)      │
// └─────────────────────────────────────────────────────────────────────┘
export const radii = {
  sm: 'rounded-lg', // 8px — badges pequeños internos
  md: 'rounded-xl', // 12px — botones, inputs
  lg: 'rounded-2xl', // 16px — cards de platos (NUNCA mezclar con otros)
  xl: 'rounded-3xl', // 24px — modals, drawers
  full: 'rounded-full', // pills, avatars
} as const

// ┌─────────────────────────────────────────────────────────────────────┐
// │ Espaciado (múltiplos de 4px)                                       │
// └─────────────────────────────────────────────────────────────────────┘
export const spacing = {
  xs: '2', // 8px
  sm: '4', // 16px
  md: '6', // 24px
  lg: '8', // 32px
  xl: '10', // 40px
  xxl: '12', // 48px
} as const

// ┌─────────────────────────────────────────────────────────────────────┐
// │ Sombras (sistema de elevación)                                     │
// └─────────────────────────────────────────────────────────────────────┘
export const shadows = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  card: 'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]',
  cardHover: 'shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)]',
} as const

// ┌─────────────────────────────────────────────────────────────────────┐
// │ Transiciones                                                       │
// └─────────────────────────────────────────────────────────────────────┘
export const transitions = {
  fast: 'transition-all duration-150 ease-out',
  normal: 'transition-all duration-200 ease-out',
  slow: 'transition-all duration-300 ease-out',
  spring: 'transition-all duration-200 cubic-bezier(0.16, 1, 0.3, 1)',
} as const
