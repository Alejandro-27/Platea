import { motion } from 'framer-motion'
import { ArrowRight, QrCode, Send, Star, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getTenantBySlug } from '@/lib/api'
import { DEMO_TENANT_SLUG, DEMO_TABLE_NUMBER } from '@/lib/demo'

interface Feature {
  title: string
  desc: string
  icon: React.ReactNode
}

const FEATURES: Feature[] = [
  {
    title: 'Menú sin contacto',
    desc: 'Los comensales abren la carta escaneando el QR de su mesa, sin instalar apps ni registrarse.',
    icon: <Phone className="h-5 w-5" aria-hidden />,
  },
  {
    title: 'Pedidos en tiempo real',
    desc: 'La cocina recibe cada pedido al instante y el comensal sigue el estado en su móvil.',
    icon: <Send className="h-5 w-5" aria-hidden />,
  },
  {
    title: 'Gestión completa',
    desc: 'Platos, categorías, mesas, inventario y personal desde un solo panel de administración.',
    icon: <Star className="h-5 w-5" aria-hidden />,
  },
]

export function HomePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const handleDemoClick = async () => {
    try {
      const tenant = await getTenantBySlug(DEMO_TENANT_SLUG)
      navigate(`/menu/${tenant.id}?table=${DEMO_TABLE_NUMBER}`)
    } catch {
      // Si no se puede resolver el demo, se ignora silenciosamente.
      // El usuario aún puede escanear un QR real desde el landing.
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-900">
      {/* Top bar: brand + language pill */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <QrCode className="h-5 w-5" aria-hidden />
              </div>
              <span className="font-playfair font-bold text-xl tracking-tight">Platea</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div
                role="group"
                aria-label="Idioma"
                className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-[2px]"
              >
                {['es', 'en'].map((language) => (
                  <button
                    key={language}
                    type="button"
                    aria-pressed={i18n.language === language}
                    onClick={() => void i18n.changeLanguage(language)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                      i18n.language === language
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {language === 'es' ? 'ES' : 'EN'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm"
          >
            <span
              className="relative flex h-1.5 w-1.5 rounded-full bg-emerald-600 after:absolute after:-inset-1 after:rounded-full after:border after:border-emerald-600 after:opacity-30 after:animate-pulse"
              aria-hidden
            />
            {t('home.kicker')}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: 'easeOut' }}
            className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight"
          >
            {t('home.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease: 'easeOut' }}
            className="mt-5 max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 leading-relaxed"
          >
            {t('home.subtitle')}
          </motion.p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3.5 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              {t('home.ctaScan')} <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </motion.button>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDemoClick}
              className="px-6 py-3.5 text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              {t('home.ctaDemo')}
            </motion.button>
          </div>

          {/* QR visual card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.24, ease: 'easeOut' }}
            className="mt-16 mx-auto max-w-[320px]"
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
                transition: { repeat: Infinity, duration: 5, ease: 'easeInOut' },
              }}
              className="relative rounded-[2rem] bg-white p-[2rem] border border-slate-100 shadow-2xl"
            >
              {/* Subtle depth layer, almost imperceptible */}
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-emerald-50/40 to-white" />

              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="flex h-44 w-44 items-center justify-center rounded-2xl bg-white shadow-lg border border-slate-100">
                  <QrCode className="h-24 w-24 text-slate-900" aria-hidden />
                </div>
                <p className="text-sm font-semibold text-slate-700">Escanea el QR de tu mesa</p>
                <p className="text-xs text-slate-500">Menú, pedidos y estado en tu móvil</p>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32 lg:pb-40">
          <div className="grid sm:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 * i, ease: 'easeOut' }}
                className="rounded-2xl bg-white p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-3 text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-xs text-slate-400">{t('home.footer')}</p>
        </div>
      </footer>
    </div>
  )
}
