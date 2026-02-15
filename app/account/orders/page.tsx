'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useAuth } from '@/lib/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { formatPrice, getStatusText } from '@/lib/utils'

interface Order {
  id: string
  total: number
  status: string
  payment_status: string
  created_at: string
  order_items?: { product_name: string; quantity: number; price: number }[]
}

export default function AccountOrdersPage() {
  const { user, session } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.access_token) {
      router.push('/login?next=/account/orders')
      return
    }
    fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        query: `query { myOrders(paging: { limit: 50 }) { id total status payment_status created_at order_items { product_name quantity price } } }`,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const list = data?.data?.myOrders ?? []
        setOrders(Array.isArray(list) ? list : [])
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [session?.access_token, router])

  if (!user) return null

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Миний захиалга</h1>
        {loading ? (
          <p>Ачааллаж байна...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-600">Захиалга байхгүй.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">#{o.id.slice(0, 8)}</span>
                  <span>{formatPrice(o.total)}</span>
                </div>
                <p className="text-sm text-gray-600">
                  Төлөв: {getStatusText(o.status)} | Төлбөр: {getStatusText(o.payment_status)}
                </p>
                <p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString('mn-MN')}</p>
                {o.order_items?.length ? (
                  <ul className="mt-2 text-sm text-gray-600">
                    {o.order_items.map((item, i) => (
                      <li key={i}>
                        {item.product_name} x {item.quantity} - {formatPrice(item.price * item.quantity)}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}