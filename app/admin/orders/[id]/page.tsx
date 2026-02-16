'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { useMutation, useQuery } from '@apollo/client'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ADMIN_ORDER, UPDATE_ORDER_STATUS } from '@/lib/admin/graphql'
import { ORDER_STATUSES } from '@/lib/shared'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AdminOrderDetailPage() {
  const params = useParams()
  const id = params.id as string

  const { data, loading } = useQuery(ADMIN_ORDER, { variables: { id } })
  const [updateStatus, { loading: updating }] = useMutation(UPDATE_ORDER_STATUS, {
    refetchQueries: [{ query: ADMIN_ORDER, variables: { id } }],
  })

  const order = data?.adminOrder
  const [status, setStatus] = React.useState(order?.status ?? '')
  const [paymentStatus, setPaymentStatus] = React.useState(order?.payment_status ?? '')
  const [internalNotes, setInternalNotes] = React.useState(order?.internal_notes ?? '')

  React.useEffect(() => {
    if (order) {
      setStatus(order.status)
      setPaymentStatus(order.payment_status)
      setInternalNotes(order.internal_notes ?? '')
    }
  }, [order])

  const handleSave = async () => {
    try {
      await updateStatus({
        variables: {
          input: { order_id: id, status, payment_status: paymentStatus, internal_notes: internalNotes },
        },
      })
      toast.success('Захиалга шинэчлэгдлээ')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Алдаа')
    }
  }

  if (loading && !order) return <Skeleton className="h-96 w-full" />
  if (!order) return <div className="text-red-600">Захиалга олдсонгүй.</div>

  const customer = order.customer_info as Record<string, unknown> | undefined
  const shipping = order.shipping_address as Record<string, unknown> | undefined

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Захиалга #{String(order.id).slice(0, 8)}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Төлөв шинэчлэх</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Захиалгын төлөв</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Төлбөрийн төлөв</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">pending</SelectItem>
                  <SelectItem value="paid">paid</SelectItem>
                  <SelectItem value="failed">failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Дотоод тэмдэглэл</Label>
            <textarea
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Зөвхөн админ харна"
            />
          </div>
          <Button onClick={handleSave} disabled={updating}>
            {updating ? 'Хадгалж байна...' : 'Хадгалах'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Харилцагч</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>Имэйл: {String(customer?.email ?? '—')}</p>
          <p>Нэр: {String(customer?.full_name ?? '—')}</p>
          <p>Утас: {String(customer?.phone ?? '—')}</p>
          {shipping && (
            <>
              <p className="mt-2 font-medium">Хаяг:</p>
              <pre className="mt-1 rounded bg-gray-100 p-2 text-xs">{JSON.stringify(shipping, null, 2)}</pre>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Барааны дэлгэрэнгүй</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Бүтээгдэхүүн</TableHead>
                <TableHead>Тоо</TableHead>
                <TableHead>Үнэ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(order.order_items ?? []).map((item: { id: string; product_name: string; quantity: number; price: number }) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.price.toLocaleString()}₮</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-2 text-right font-medium">
            Дэд дүн: {order.subtotal?.toLocaleString()}₮ · Хүргэлт: {order.shipping_cost?.toLocaleString()}₮ · Нийт: {order.total?.toLocaleString()}₮
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
