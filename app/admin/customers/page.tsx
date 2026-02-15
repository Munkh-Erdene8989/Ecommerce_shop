'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/providers/AuthProvider'
import { formatPrice } from '@/lib/utils'

interface Customer {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  created_at: string
  order_count?: number
  total_spent?: number
}

export default function AdminCustomersPage() {
  const { session } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.access_token) return
    fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        query: `query { adminCustomers(paging: { limit: 100 }) { id email full_name phone created_at order_count total_spent } }`,
      }),
    })
      .then((r) => r.json())
      .then((data) => setCustomers(data?.data?.adminCustomers ?? []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false))
  }, [session?.access_token])

  if (loading) return <p>Ачааллаж байна...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Хэрэглэгчид</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">Имэйл</th>
              <th className="text-left p-3">Нэр</th>
              <th className="text-left p-3">Утас</th>
              <th className="text-left p-3">Захиалга</th>
              <th className="text-left p-3">Нийт зарцуулсан</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{c.email}</td>
                <td className="p-3">{c.full_name ?? '-'}</td>
                <td className="p-3">{c.phone ?? '-'}</td>
                <td className="p-3">{c.order_count ?? 0}</td>
                <td className="p-3">{c.total_spent != null ? formatPrice(c.total_spent) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
