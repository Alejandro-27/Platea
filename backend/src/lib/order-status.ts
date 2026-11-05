import type { OrderItemStatus, OrderStatus } from '@prisma/client'

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['SERVED', 'CANCELLED'],
  SERVED: [],
  CANCELLED: [],
}

const ITEM_TRANSITIONS: Record<OrderItemStatus, OrderItemStatus[]> = {
  PENDING: ['PREPARING'],
  PREPARING: ['READY'],
  READY: ['SERVED'],
  SERVED: [],
}

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to)
}

export function canTransitionItem(from: OrderItemStatus, to: OrderItemStatus): boolean {
  return ITEM_TRANSITIONS[from].includes(to)
}
