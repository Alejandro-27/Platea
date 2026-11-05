import { Prisma } from '@prisma/client'
import type { Server } from 'socket.io'

export const orderInclude = {
  table: { select: { id: true, number: true } },
  items: {
    include: { dish: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.OrderInclude

export type OrderWithDetails = Prisma.OrderGetPayload<{ include: typeof orderInclude }>

export async function deductIngredients(
  tx: Prisma.TransactionClient,
  tenantId: string,
  item: {
    quantity: number
    dish: { dishIngredients: Array<{ ingredientId: string; quantity: Prisma.Decimal }> }
  },
): Promise<void> {
  for (const ingredient of item.dish.dishIngredients) {
    const amount = new Prisma.Decimal(ingredient.quantity).mul(item.quantity)
    await tx.ingredient.update({
      where: { id: ingredient.ingredientId, tenantId },
      data: { currentStock: { decrement: amount } },
    })
  }
}

function emit(io: Server, order: OrderWithDetails, event: 'order:new' | 'order:updated'): void {
  io.to(`kds:${order.tenantId}`).to(`waiter:${order.tenantId}`).emit(event, order)
  io.to(`session:${order.sessionId}`).emit(event, order)
  if (order.tableId) io.to(`table:${order.tableId}`).emit(event, order)
}

export function emitNewOrder(io: Server, order: OrderWithDetails): void {
  emit(io, order, 'order:new')
}

export function emitOrderUpdated(io: Server, order: OrderWithDetails): void {
  emit(io, order, 'order:updated')
}
