import type { FastifyInstance } from 'fastify'
import tenantsRoutes from './routes'
import superTenantRoutes from './routes-super'
import adminTenantRoutes from './routes-admin'

export default async function tenantsModule(app: FastifyInstance): Promise<void> {
  await app.register(tenantsRoutes, { prefix: '/api/public/tenants' })
  await app.register(superTenantRoutes, { prefix: '/api/tenants' })
  await app.register(adminTenantRoutes, { prefix: '/api/tenant' })
}
