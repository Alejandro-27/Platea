import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from '../i18n/es.json'
import en from '../i18n/en.json'
import type { Locale } from '../types/api'

const STORAGE_KEY = 'platea-lang'

function initialLanguage(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'es' || stored === 'en') return stored
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es'
}

const language = initialLanguage()

void i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: language,
  fallbackLng: 'es',
  supportedLngs: ['es', 'en'],
  interpolation: { escapeValue: false },
})

document.documentElement.lang = language

export function setLanguage(next: Locale): void {
  localStorage.setItem(STORAGE_KEY, next)
  document.documentElement.lang = next
  void i18n.changeLanguage(next)
}

export default i18n
