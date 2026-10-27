import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import { env } from '../config/env'

export default fp(
  async (app) => {
    await app.register(fastifyJwt, { secret: env.JWT_SECRET })

    // Prehandler para rutas privadas: valida el Bearer token y deja
    // request.user con { sub, email, role, tenantId }.
    app.decorate('authenticate', async function (request, reply) {
      try {
        await request.jwtVerify()
      } catch {
        await reply.code(401).send({ error: 'No autorizado' })
      }
    })
  },
  { name: 'jwt' },
)
