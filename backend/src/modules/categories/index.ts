import type { FastifyInstance } from 'fastify'
import categoriesRoutes from './routes'

export default async function categoriesModule(app: FastifyInstance): Promise<void> {
  await app.register(categoriesRoutes, { prefix: '/api/categories' })
}
