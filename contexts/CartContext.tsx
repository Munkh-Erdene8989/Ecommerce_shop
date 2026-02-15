'use client'

import { createContext, useContext, useState, useEffect } from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  slug?: string
}

type CartContextType = {
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('cart') : null
    if (saved) setCart(JSON.parse(saved))
  }, [])
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i))
      return [...prev, { ...item, quantity }]
    })
  }
  const removeFromCart = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id))
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) removeFromCart(id)
    else setCart((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)))
  }
  const clearCart = () => setCart([])
  const getTotal = () => cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const getItemCount = () => cart.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getTotal, getItemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (ctx === undefined) throw new Error('useCart must be used within CartProvider')
  return ctx
}
