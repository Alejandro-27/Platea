import type { FastifyInstance } from 'fastify'
import tenantsRoutes from './routes'

export default async function tenantsModule(app: FastifyInstance): Promise<void> {
  await app.register(tenantsRoutes, { prefix: '/api/public/tenants' })
}
