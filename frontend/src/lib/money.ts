import type { Locale } from '../types/api'

const localeTag = (locale: string): string =>
  locale.toLowerCase().startsWith('en') ? 'en-US' : 'es-ES'

// Los precios llegan como string decimal; solo se convierten para mostrarlos.
export function priceToCents(price: string): number {
  return Math.round(Number(price) * 100)
}

export function formatCents(cents: number, locale: string): string {
  return new Intl.NumberFormat(localeTag(locale), {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

export function formatMoney(price: string, locale: string): string {
  return formatCents(priceToCents(price), locale)
}

export function formatRating(rating: string, locale: string): string {
  return new Intl.NumberFormat(localeTag(locale), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number(rating))
}

export function formatTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function currentLocale(locale: string): Locale {
  return locale.toLowerCase().startsWith('en') ? 'en' : 'es'
}
