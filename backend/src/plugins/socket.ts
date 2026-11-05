import fp from 'fastify-plugin'
import { Server } from 'socket.io'
import { env } from '../config/env'
import { prisma } from '../lib/prisma'
import type { AuthUser } from '../types/auth'

const STAFF_ROOMS = new Set(['kds', 'waiter'])
const CUSTOMER_ROOMS = new Set(['session', 'table'])

/**
 * Socket.io en una sola instancia (adapter en memoria).
 * El cliente se autentica en el handshake con:
 * - { token }      -> staff (JWT)
 * - { sessionId }  -> comensal (sesión anónima vigente)
 * Solo puede unirse a rooms de su propio tenant/sesión/mesa.
 */
export default fp(
  async (app) => {
    const io = new Server(app.server, {
      cors: { origin: env.FRONTEND_URL, credentials: true },
    })

    io.on('connection', (socket) => {
      let tenantId: string | null = null
      let sessionId: string | null = null
      let tableId: string | null = null
      let isStaff = false

      // Los handlers se registran antes de resolver la sesión para no perder
      // los eventos que el cliente emite nada más conectar.
      const authReady = (async () => {
        const auth = (socket.handshake.auth ?? {}) as { token?: unknown; sessionId?: unknown }

        if (typeof auth.token === 'string') {
          try {
            const payload = app.jwt.verify<AuthUser>(auth.token)
            tenantId = payload.tenantId
            isStaff = true
          } catch {
            socket.disconnect(true)
          }
        } else if (typeof auth.sessionId === 'string') {
          const session = await prisma.session.findUnique({
            where: { id: auth.sessionId },
            select: {
              tenantId: true,
              tableId: true,
              expiresAt: true,
              tenant: { select: { isActive: true } },
            },
          })
          if (!session || !session.tenant.isActive || session.expiresAt < new Date()) {
            socket.disconnect(true)
            return
          }
          tenantId = session.tenantId
          sessionId = auth.sessionId
          tableId = session.tableId
        } else {
          socket.disconnect(true)
        }
      })()

      socket.on('room:join', async (room: unknown) => {
        await authReady
        if (typeof room !== 'string') return
        const [scope, id] = room.split(':')
        if (!id) return

        if (isStaff && STAFF_ROOMS.has(scope) && id === tenantId) {
          await socket.join(room)
        } else if (!isStaff && CUSTOMER_ROOMS.has(scope)) {
          if (scope === 'session' && id === sessionId) await socket.join(room)
          if (scope === 'table' && id === tableId) await socket.join(room)
        }
      })

      socket.on('room:leave', (room: unknown) => {
        if (typeof room === 'string') void socket.leave(room)
      })
    })

    app.decorate('io', io)
    app.addHook('onClose', async () => {
      await io.close()
    })
  },
  { name: 'socket' }
)
