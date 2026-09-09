'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { CartItem, CartState } from '@/types'
import { CART_STORAGE_KEY } from '@/constants'

interface CartContextValue {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (menu_id: string) => void
  updateQuantity: (menu_id: string, quantity: number) => void
  clearCart: () => void
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        const parsed: CartState = JSON.parse(stored)
        setItems(parsed.items ?? [])
      }
    } catch {
      // ignore parse errors
    }
    setHydrated(true)
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items }))
  }, [items, hydrated])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menu_id === item.menu_id)
      if (existing) {
        return prev.map((i) =>
          i.menu_id === item.menu_id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((menu_id: string) => {
    setItems((prev) => prev.filter((i) => i.menu_id !== menu_id))
  }, [])

  const updateQuantity = useCallback((menu_id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.menu_id !== menu_id))
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.menu_id === menu_id ? { ...i, quantity } : i))
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
