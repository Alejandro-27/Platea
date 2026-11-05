import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { parse } from '../../lib/validation'
import { AppError, notFound } from '../../lib/errors'

const SESSION_TTL_MS = 4 * 60 * 60 * 1000

const createSchema = z.object({
  tenantId: z.string().min(1),
  tableId: z.string().min(1),
  qrCode: z.string().min(1).optional(),
  deviceInfo: z.string().max(300).optional(),
})

const paramsSchema = z.object({ id: z.string().min(1) })

export default async function sessionsRoutes(app: FastifyInstance): Promise<void> {
  // El comensal escanea el QR y abre una sesión anónima sin registro.
  app.post(
    '/sessions',
    { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const body = parse(createSchema, request.body)

      const table = await prisma.table.findFirst({
        where: { id: body.tableId, tenantId: body.tenantId, isActive: true },
        include: { tenant: { select: { isActive: true } } },
      })

      const invalidQr = body.qrCode !== undefined && table !== null && body.qrCode !== table.qrCode
      if (!table || !table.tenant.isActive || invalidQr) {
        throw notFound('Mesa')
      }

      const session = await prisma.session.create({
        data: {
          tenantId: body.tenantId,
          tableId: table.id,
          deviceInfo: body.deviceInfo,
          expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        },
        select: { id: true, tenantId: true, tableId: true, expiresAt: true },
      })

      return reply.code(201).send({
        data: { ...session, table: { id: table.id, number: table.number } },
      })
    }
  )

  app.get('/sessions/:id', async (request) => {
    const { id } = parse(paramsSchema, request.params)

    const session = await prisma.session.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        tableId: true,
        expiresAt: true,
        table: { select: { number: true } },
      },
    })

    if (!session) throw notFound('Sesión')
    if (session.expiresAt <= new Date()) {
      throw new AppError(410, 'SESSION_EXPIRED', 'La sesión expiró')
    }

    return { data: session }
  })
}
