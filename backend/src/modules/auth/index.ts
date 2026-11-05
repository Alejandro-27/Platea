import type { FastifyInstance } from 'fastify'
import authRoutes from './routes'

export default async function authModule(app: FastifyInstance): Promise<void> {
  await app.register(authRoutes, { prefix: '/api/auth' })
}
