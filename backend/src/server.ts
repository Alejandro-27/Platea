import 'dotenv/config'
import Fastify, { type FastifyInstance } from 'fastify'
import helmet from '@fastify/helmet'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { env } from './config/env'
import { AppError } from './lib/errors'
import { prisma } from './lib/prisma'
import corsPlugin from './plugins/cors'
import jwtPlugin from './plugins/jwt'
import socketPlugin from './plugins/socket'
import tenantPlugin from './plugins/tenant'
import authModule from './modules/auth'
import usersModule from './modules/users'
import categoriesModule from './modules/categories'
import dishesModule from './modules/dishes'
import ingredientsModule from './modules/ingredients'
import tablesModule from './modules/tables'
import sessionsModule from './modules/sessions'
import tenantsModule from './modules/tenants'
import ordersModule from './modules/orders'
import reviewsModule from './modules/reviews'
import uploadModule from './modules/upload'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: env.NODE_ENV === 'production' ? 'info' : 'debug' },
  })

  await app.register(helmet)
  await app.register(corsPlugin)
  await app.register(jwtPlugin)
  await app.register(socketPlugin)
  await app.register(tenantPlugin)

  await app.register(authModule)
  await app.register(usersModule)
  await app.register(categoriesModule)
  await app.register(dishesModule)
  await app.register(ingredientsModule)
  await app.register(tablesModule)
  await app.register(sessionsModule)
  await app.register(tenantsModule)
  await app.register(ordersModule)
  await app.register(reviewsModule)
  await app.register(uploadModule)

  app.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }))

  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({
      error: { code: 'NOT_FOUND', message: 'Ruta no encontrada', details: [] },
    })
  })

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      reply.code(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details },
      })
      return
    }

    if (error instanceof ZodError) {
      reply.code(422).send({
        error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: error.issues },
      })
      return
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002' || error.code === 'P2003') {
        reply.code(409).send({
          error: {
            code: 'CONFLICT',
            message: 'El recurso entra en conflicto con otro existente',
            details: error.code === 'P2002' ? error.meta : [],
          },
        })
        return
      }

      if (error.code === 'P2025') {
        reply.code(404).send({
          error: { code: 'NOT_FOUND', message: 'Recurso no encontrado', details: [] },
        })
        return
      }

      request.log.error(error)
      reply.code(500).send({
        error: { code: 'INTERNAL_ERROR', message: 'Error interno', details: [] },
      })
      return
    }

    const fastifyError = error as { statusCode?: number; code?: string; message?: string }
    if (fastifyError.statusCode === 413 || fastifyError.code === 'FST_REQ_FILE_TOO_LARGE') {
      reply.code(413).send({
        error: { code: 'PAYLOAD_TOO_LARGE', message: 'El archivo supera el tamaño permitido', details: [] },
      })
      return
    }

    if (fastifyError.statusCode && fastifyError.statusCode >= 400 && fastifyError.statusCode < 500) {
      reply.code(fastifyError.statusCode).send({
        error: {
          code: fastifyError.code ?? 'BAD_REQUEST',
          message: fastifyError.message ?? 'Solicitud inválida',
          details: [],
        },
      })
      return
    }

    request.log.error(error)
    reply.code(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno', details: [] },
    })
  })

  app.addHook('onClose', async () => {
    await prisma.$disconnect()
  })

  return app
}

export async function start(): Promise<void> {
  const app = await buildApp()

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
    app.log.info(`Platea API escuchando en el puerto ${env.PORT}`)
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`${signal} recibido, cerrando servidor`)
    await app.close()
    process.exit(0)
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
}

if (require.main === module) {
  void start()
}
