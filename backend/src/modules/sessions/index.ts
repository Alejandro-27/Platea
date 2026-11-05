import type { FastifyInstance } from 'fastify'
import sessionsRoutes from './routes'

export default async function sessionsModule(app: FastifyInstance): Promise<void> {
  await app.register(sessionsRoutes, { prefix: '/api/public' })
}
