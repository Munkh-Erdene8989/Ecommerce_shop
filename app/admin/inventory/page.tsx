'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/providers/AuthProvider'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  slug: string
  stock_quantity: number
  in_stock: boolean
}

export default function AdminInventoryPage() {
  const { session } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.access_token) return
    fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        query: `query { adminProducts(paging: { limit: 100 }) { id name slug stock_quantity in_stock } }`,
      }),
    })
      .then((r) => r.json())
      .then((data) => setProducts(data?.data?.adminProducts ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [session?.access_token])

  if (loading) return <p>Ачааллаж байна...</p>

  const lowStock = products.filter((p) => p.stock_quantity < 10)
  const outOfStock = products.filter((p) => !p.in_stock)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Нөөц</h1>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Бага нөөц (&lt;10)</p>
          <p className="text-xl font-bold">{lowStock.length}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Дууссан</p>
          <p className="text-xl font-bold text-red-600">{outOfStock.length}</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">Бүтээгдэхүүн</th>
              <th className="text-left p-3">Нөөц</th>
              <th className="text-left p-3">Төлөв</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <Link href={`/products/${p.slug}`} className="text-primary hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="p-3">{p.stock_quantity}</td>
                <td className="p-3">{p.in_stock ? 'Байгаа' : 'Дууссан'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
