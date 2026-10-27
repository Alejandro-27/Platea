import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import Fastify from 'fastify'
import autoload from '@fastify/autoload'
import { env } from './config/env'
import { prisma } from './lib/prisma'
import corsPlugin from './plugins/cors'
import jwtPlugin from './plugins/jwt'
import socketPlugin from './plugins/socket'
import tenantPlugin from './plugins/tenant'

const app = Fastify({
  logger: { level: env.NODE_ENV === 'production' ? 'info' : 'debug' },
})

async function build() {
  await app.register(corsPlugin)
  await app.register(jwtPlugin)
  await app.register(socketPlugin)
  await app.register(tenantPlugin)

  // Cada carpeta dentro de modules/ es un plugin Fastify (routes + service).
  const modulesDir = path.join(__dirname, 'modules')
  if (fs.existsSync(modulesDir)) {
    await app.register(autoload, { dir: modulesDir })
  }

  app.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }))

  app.addHook('onClose', async () => {
    await prisma.$disconnect()
  })
}

async function start() {
  await build()
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
  app.log.info(`Platea API escuchando en el puerto ${env.PORT}`)
}

const shutdown = async (signal: string) => {
  app.log.info(`${signal} recibido, cerrando servidor`)
  await app.close()
  process.exit(0)
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

start().catch((err) => {
  app.log.error(err)
  process.exit(1)
})
