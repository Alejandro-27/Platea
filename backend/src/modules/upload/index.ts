import type { FastifyInstance } from 'fastify'
import multipart from '@fastify/multipart'
import uploadRoutes from './routes'

export default async function uploadModule(app: FastifyInstance): Promise<void> {
  await app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  })

  await app.register(uploadRoutes, { prefix: '/api/upload' })
}
