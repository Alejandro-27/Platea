import type { FastifyInstance } from 'fastify'
import ingredientsRoutes from './routes'

export default async function ingredientsModule(app: FastifyInstance): Promise<void> {
  await app.register(ingredientsRoutes, { prefix: '/api/ingredients' })
}
