'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/providers/AuthProvider'

interface Coupon {
  id: string
  code: string
  type: string
  value: number
  min_order_amount: number | null
  max_uses: number | null
  used_count: number
  valid_from: string | null
  valid_until: string | null
}

export default function AdminCouponsPage() {
  const { session } = useAuth()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.access_token) return
    fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        query: `query { adminProducts(paging: { limit: 1 }) { id } }`,
      }),
    })
      .then(() => {
        setCoupons([])
      })
      .finally(() => setLoading(false))
  }, [session?.access_token])

  if (loading) return <p>Ачааллаж байна...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Купон</h1>
      <p className="text-gray-600">Купон нэмэх, засах нь GraphQL mutation createCoupon / deleteCoupon ашиглан backend-аас хийнэ.</p>
      <p className="text-sm text-gray-500 mt-2">Одоогоор жагсаалт: Supabase-аас шууд унших эсвэл admin API нэмнэ.</p>
    </div>
  )
}
