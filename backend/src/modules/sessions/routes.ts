import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { parse } from '../../lib/validation'
import { AppError, notFound } from '../../lib/errors'

const SESSION_TTL_MS = 4 * 60 * 60 * 1000

const createSchema = z.object({
  tenantId: z.string().min(1),
  tableId: z.string().min(1).optional(),
  tableNumber: z.number().int().positive().optional(),
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

      // Detectar si tableId es un número puro (el frontend envía el número de mesa,
      // no el ID cuid cuando navega desde el landing de demostración).
      const isTableNumber = /^\d+$/.test(body.tableId ?? '')

      // Validar que el tenant exista y esté activo.
      const tenant = await prisma.tenant.findUnique({
        where: { id: body.tenantId },
        select: { id: true, isActive: true },
      })
      if (!tenant || !tenant.isActive) {
        throw notFound('Restaurante')
      }

      // Resolver tableId: puede venir directamente como ID cuid, como número de mesa,
      // o a través de tableNumber.
      let resolvedTableId: string | undefined = body.tableId
      let tableNumber: number | undefined

      if (isTableNumber) {
        const table = await prisma.table.findFirst({
          where: {
            tenantId: body.tenantId,
            number: Number(body.tableId),
            isActive: true,
          },
          select: { id: true, number: true },
        })
        if (!table) {
          throw notFound('Mesa')
        }
        resolvedTableId = table.id
        tableNumber = table.number
      } else if (!resolvedTableId && body.tableNumber !== undefined) {
        const table = await prisma.table.findFirst({
          where: {
            tenantId: body.tenantId,
            number: body.tableNumber,
            isActive: true,
          },
          select: { id: true, number: true },
        })
        if (!table) {
          throw notFound('Mesa')
        }
        resolvedTableId = table.id
        tableNumber = table.number
      }

      // Si se proporciona tableId directamente (no es número puro), validar que exista y esté activa.
      if (resolvedTableId && !isTableNumber) {
        const table = await prisma.table.findUnique({
          where: { id: resolvedTableId },
          select: { id: true, number: true, isActive: true, tenantId: true },
        })
        if (!table || table.tenantId !== body.tenantId || !table.isActive) {
          throw notFound('Mesa')
        }
        tableNumber = table.number
      }

      if (!resolvedTableId) {
        throw new AppError(422, 'VALIDATION_ERROR', 'Se requiere tableId o tableNumber')
      }

      const session = await prisma.session.create({
        data: {
          tenantId: body.tenantId,
          tableId: resolvedTableId,
          deviceInfo: body.deviceInfo,
          expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        },
        select: { id: true, tenantId: true, tableId: true, expiresAt: true },
      })

      return reply.code(201).send({
        data: { ...session, table: { number: tableNumber ?? 0 } },
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
