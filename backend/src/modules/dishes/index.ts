import type { FastifyInstance } from 'fastify'
import dishesRoutes from './routes'

export default async function dishesModule(app: FastifyInstance): Promise<void> {
  await app.register(dishesRoutes, { prefix: '/api/dishes' })
}
