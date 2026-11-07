import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartLine {
  dishId: string
  name: string
  price: string
  quantity: number
  notes: string
}

interface CartState {
  tenantId: string | null
  tableId: string | null
  lines: CartLine[]
  orderNotes: string
  setScope: (tenantId: string, tableId: string) => void
  add: (dish: { id: string; name: string; price: string }) => void
  setQuantity: (dishId: string, quantity: number) => void
  setNotes: (dishId: string, notes: string) => void
  setOrderNotes: (notes: string) => void
  clear: () => void
}

const MAX_QUANTITY = 99

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      tenantId: null,
      tableId: null,
      lines: [],
      orderNotes: '',
      setScope: (tenantId, tableId) => {
        const state = get()
        if (state.tenantId === tenantId && state.tableId === tableId) return
        set({ tenantId, tableId, lines: [], orderNotes: '' })
      },
      add: (dish) =>
        set((state) => {
          const existing = state.lines.find((line) => line.dishId === dish.id)
          if (existing) {
            return {
              lines: state.lines.map((line) =>
                line.dishId === dish.id
                  ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + 1) }
                  : line
              ),
            }
          }
          return {
            lines: [
              ...state.lines,
              { dishId: dish.id, name: dish.name, price: dish.price, quantity: 1, notes: '' },
            ],
          }
        }),
      setQuantity: (dishId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((line) => line.dishId !== dishId)
              : state.lines.map((line) =>
                  line.dishId === dishId
                    ? { ...line, quantity: Math.min(MAX_QUANTITY, quantity) }
                    : line
                ),
        })),
      setNotes: (dishId, notes) =>
        set((state) => ({
          lines: state.lines.map((line) => (line.dishId === dishId ? { ...line, notes } : line)),
        })),
      setOrderNotes: (orderNotes) => set({ orderNotes }),
      clear: () => set({ lines: [], orderNotes: '' }),
    }),
    { name: 'platea-cart', version: 1 }
  )
)
