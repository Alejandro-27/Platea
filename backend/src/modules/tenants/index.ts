import type { FastifyInstance } from 'fastify'
import tenantsRoutes from './routes'
import superTenantRoutes from './routes-super'

export default async function tenantsModule(app: FastifyInstance): Promise<void> {
  await app.register(tenantsRoutes, { prefix: '/api/public/tenants' })
  await app.register(superTenantRoutes, { prefix: '/api/tenants' })
}
