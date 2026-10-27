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

    io.on('connection', async (socket) => {
      const auth = (socket.handshake.auth ?? {}) as { token?: unknown; sessionId?: unknown }
      let tenantId: string | null = null
      let sessionId: string | null = null
      let tableId: string | null = null
      let isStaff = false

      if (typeof auth.token === 'string') {
        try {
          const payload = app.jwt.verify<AuthUser>(auth.token)
          tenantId = payload.tenantId
          isStaff = true
        } catch {
          socket.disconnect(true)
          return
        }
      } else if (typeof auth.sessionId === 'string') {
        const session = await prisma.session.findUnique({
          where: { id: auth.sessionId },
          select: { tenantId: true, tableId: true, expiresAt: true },
        })
        if (!session || session.expiresAt < new Date()) {
          socket.disconnect(true)
          return
        }
        tenantId = session.tenantId
        sessionId = auth.sessionId
        tableId = session.tableId
      } else {
        socket.disconnect(true)
        return
      }

      socket.on('room:join', (room: unknown) => {
        if (typeof room !== 'string') return
        const [scope, id] = room.split(':')
        if (!id) return

        if (isStaff && STAFF_ROOMS.has(scope) && id === tenantId) {
          socket.join(room)
        } else if (!isStaff && CUSTOMER_ROOMS.has(scope)) {
          if (scope === 'session' && id === sessionId) socket.join(room)
          if (scope === 'table' && id === tableId) socket.join(room)
        }
      })

      socket.on('room:leave', (room: unknown) => {
        if (typeof room === 'string') socket.leave(room)
      })
    })

    app.decorate('io', io)
    app.addHook('onClose', async () => {
      await io.close()
    })
  },
  { name: 'socket' },
)
