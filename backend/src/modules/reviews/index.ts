import type { FastifyInstance } from 'fastify'
import reviewsRoutes from './routes'

export default async function reviewsModule(app: FastifyInstance): Promise<void> {
  await app.register(reviewsRoutes, { prefix: '/api/public' })
}
