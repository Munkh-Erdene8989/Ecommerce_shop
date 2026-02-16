'use client'

import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3, Package, ShoppingCart, TrendingUp } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const DASHBOARD_STATS = gql`
  query DashboardStats($range: String) {
    dashboardStats(range: $range) {
      totalRevenue
      totalOrders
      pendingOrders
      totalProducts
      outOfStock
      recentOrdersCount
    }
  }
`

export default function AdminOverviewPage() {
  const { data, loading, error } = useQuery(DASHBOARD_STATS, {
    variables: { range: '30d' },
  })

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        Алдаа: {error.message}
      </div>
    )
  }

  const stats = data?.dashboardStats

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Overview</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Нийт орлого</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{(stats?.totalRevenue ?? 0).toLocaleString()}₮</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Захиалга</CardTitle>
                <ShoppingCart className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.totalOrders ?? 0}</p>
                <p className="text-xs text-gray-500">Хүлээгдэж буй: {stats?.pendingOrders ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Бүтээгдэхүүн</CardTitle>
                <Package className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.totalProducts ?? 0}</p>
                <p className="text-xs text-gray-500">Дуусах: {stats?.outOfStock ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Сүүлийн 7 хоног</CardTitle>
                <BarChart3 className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.recentOrdersCount ?? 0}</p>
                <p className="text-xs text-gray-500">захиалга</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Орлого / Захиалга (placeholder)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'Placeholder', value: stats?.totalRevenue ?? 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#c71585" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
