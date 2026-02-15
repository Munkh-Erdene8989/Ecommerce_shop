'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/providers/AuthProvider'
import { formatPrice } from '@/lib/utils'

interface Stats {
  totalRevenue: number
  totalOrders: number
  pendingOrders: number
  totalProducts: number
  outOfStock: number
  recentOrdersCount: number
}

export default function AdminDashboardPage() {
  const { session } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.access_token) return
    fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        query: `query { dashboardStats { totalRevenue totalOrders pendingOrders totalProducts outOfStock recentOrdersCount } }`,
      }),
    })
      .then((r) => r.json())
      .then((data) => setStats(data?.data?.dashboardStats ?? null))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [session?.access_token])

  if (loading) return <p>Ачааллаж байна...</p>
  if (!stats) return <p>Статистик ачааллахад алдаа гарлаа.</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Хянах самбар</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Нийт орлого</p>
          <p className="text-xl font-bold text-primary">{formatPrice(stats.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Захиалгын тоо</p>
          <p className="text-xl font-bold">{stats.totalOrders}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Хүлээгдэж буй</p>
          <p className="text-xl font-bold">{stats.pendingOrders}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Бүтээгдэхүүн</p>
          <p className="text-xl font-bold">{stats.totalProducts}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Дууссан нөөц</p>
          <p className="text-xl font-bold text-red-600">{stats.outOfStock}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Сүүлийн 7 хоног</p>
          <p className="text-xl font-bold">{stats.recentOrdersCount}</p>
        </div>
      </div>
    </div>
  )
}
