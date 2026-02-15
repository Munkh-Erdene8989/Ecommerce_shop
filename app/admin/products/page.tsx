'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/providers/AuthProvider'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  stock_quantity: number
  in_stock: boolean
  category: string
}

export default function AdminProductsPage() {
  const { session } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.access_token) return
    fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        query: `query { adminProducts(paging: { limit: 100 }) { id name slug price stock_quantity in_stock category } }`,
      }),
    })
      .then((r) => r.json())
      .then((data) => setProducts(data?.data?.adminProducts ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [session?.access_token])

  if (loading) return <p>Ачааллаж байна...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Бүтээгдэхүүн</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">Нэр</th>
              <th className="text-left p-3">Үнэ</th>
              <th className="text-left p-3">Нөөц</th>
              <th className="text-left p-3">Төлөв</th>
              <th className="text-left p-3">Ангилал</th>
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
                <td className="p-3">{formatPrice(p.price)}</td>
                <td className="p-3">{p.stock_quantity}</td>
                <td className="p-3">{p.in_stock ? 'Байгаа' : 'Дууссан'}</td>
                <td className="p-3">{p.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
