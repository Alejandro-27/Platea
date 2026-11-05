import type { FastifyInstance } from 'fastify'
import { requireRole, requireTenant } from '../../lib/guards'
import { uploadImage } from '../../lib/cloudinary'
import { AppError } from '../../lib/errors'

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export default async function uploadRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/',
    {
      preHandler: [app.authenticate, requireRole('ADMIN')],
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request)

      const file = await request.file()
      if (!file) throw new AppError(422, 'VALIDATION_ERROR', 'Archivo requerido')

      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        throw new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Solo se aceptan JPEG, PNG o WebP')
      }

      const buffer = await file.toBuffer()
      if (buffer.length === 0) {
        throw new AppError(422, 'VALIDATION_ERROR', 'El archivo está vacío')
      }

      const url = await uploadImage(buffer, `platea/${tenantId}/dishes`)

      return reply.code(201).send({ data: { url } })
    }
  )
}
