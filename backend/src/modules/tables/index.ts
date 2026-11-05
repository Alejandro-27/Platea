import type { FastifyInstance } from 'fastify'
import tablesRoutes from './routes'

export default async function tablesModule(app: FastifyInstance): Promise<void> {
  await app.register(tablesRoutes, { prefix: '/api/tables' })
}
