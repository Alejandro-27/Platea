import type { FastifyInstance } from 'fastify'
import publicOrderRoutes from './routes-public'
import staffOrderRoutes from './routes-staff'

export default async function ordersModule(app: FastifyInstance): Promise<void> {
  await app.register(publicOrderRoutes, { prefix: '/api/public' })
  await app.register(staffOrderRoutes, { prefix: '/api/orders' })
}
