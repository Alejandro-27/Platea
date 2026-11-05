import type { FastifyInstance } from 'fastify'
import usersRoutes from './routes'

export default async function usersModule(app: FastifyInstance): Promise<void> {
  await app.register(usersRoutes, { prefix: '/api/users' })
}
