'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/providers/AuthProvider'
import { formatPrice, getStatusText } from '@/lib/utils'

interface Order {
  id: string
  total: number
  status: string
  payment_status: string
  created_at: string
  order_items?: { product_name: string; quantity: number; price: number }[]
}

export default function AdminOrdersPage() {
  const { session } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.access_token) return
    fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        query: `query { adminOrders(paging: { limit: 100 }) { id total status payment_status created_at order_items { product_name quantity price } } }`,
      }),
    })
      .then((r) => r.json())
      .then((data) => setOrders(data?.data?.adminOrders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [session?.access_token])

  if (loading) return <p>Ачааллаж байна...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Захиалга</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Нийт</th>
              <th className="text-left p-3">Төлөв</th>
              <th className="text-left p-3">Төлбөр</th>
              <th className="text-left p-3">Огноо</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono text-xs">#{o.id.slice(0, 8)}</td>
                <td className="p-3">{formatPrice(o.total)}</td>
                <td className="p-3">{getStatusText(o.status)}</td>
                <td className="p-3">{getStatusText(o.payment_status)}</td>
                <td className="p-3">{new Date(o.created_at).toLocaleString('mn-MN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
