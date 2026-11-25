import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import { env } from '../config/env'

export default fp(
  async (app) => {
    await app.register(cors, {
      origin: env.FRONTEND_URL,
      credentials: true,
      // @fastify/cors limita por defecto a GET,HEAD,POST; el panel usa PATCH y DELETE.
      methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    })
  },
  { name: 'cors' }
)
