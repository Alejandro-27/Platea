import fp from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'
import { AppError } from '../lib/errors'

/**
 * Límite global por IP. Los endpoints sensibles (login, sesiones, pedidos y
 * upload) lo endurecen en su propia ruta con `config.rateLimit`.
 */
export default fp(
  async (app) => {
    await app.register(rateLimit, {
      global: true,
      max: 300,
      timeWindow: '1 minute',
      // El plugin lanza el objeto devuelto; AppError lo deja en el formato común.
      errorResponseBuilder: (_request, context) =>
        new AppError(
          429,
          'RATE_LIMIT',
          `Demasiadas peticiones. Reintenta en ${Math.ceil(context.ttl / 1000)} s`
        ),
    })
  },
  { name: 'rate-limit' }
)
