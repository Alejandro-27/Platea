import { io, type Socket } from 'socket.io-client'
import { API_URL } from './api'

export function createCustomerSocket(sessionId: string): Socket {
  return io(API_URL, {
    auth: { sessionId },
    transports: ['websocket', 'polling'],
  })
}

export function createStaffSocket(token: string): Socket {
  return io(API_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  })
}
