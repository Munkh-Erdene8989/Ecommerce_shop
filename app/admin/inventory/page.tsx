'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ADMIN_PRODUCTS } from '@/lib/admin/graphql'

const ADJUST_INVENTORY = gql`
  mutation AdjustInventory($input: UpdateStockInput!) {
    adjustInventory(input: $input)
  }
`

export default function AdminInventoryPage() {
  const [productId, setProductId] = useState('')
  const [quantityDelta, setQuantityDelta] = useState('')
  const [reason, setReason] = useState('')

  const { data: productsData } = useQuery(ADMIN_PRODUCTS, {
    variables: { paging: { limit: 500, offset: 0 } },
  })
  const products = productsData?.adminProducts ?? []

  const [adjustInventory, { loading }] = useMutation(ADJUST_INVENTORY, {
    refetchQueries: [{ query: ADMIN_PRODUCTS, variables: { paging: { limit: 500, offset: 0 } } }],
  })

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    const pid = productId.trim()
    const delta = parseInt(quantityDelta, 10)
    const r = reason.trim()
    if (!pid || isNaN(delta) || delta === 0 || !r) {
      toast.error('Бүтээгдэхүүн сонгоно уу, тоо хэмжээ болон шалтгаан оруулна уу.')
      return
    }
    try {
      await adjustInventory({
        variables: {
          input: { product_id: pid, quantity_delta: delta, reason: r },
        },
      })
      toast.success('Нөөц шинэчлэгдлээ')
      setQuantityDelta('')
      setReason('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Алдаа')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Нөөц</h1>

      <Card>
        <CardHeader>
          <CardTitle>Нөөц тохируулах</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdjust} className="flex flex-wrap items-end gap-4">
            <div className="min-w-[200px]">
              <Label>Бүтээгдэхүүн</Label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              >
                <option value="">Сонгох</option>
                {products.map((p: { id: string; name: string }) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Өөрчлөлт (+/-)</Label>
              <Input
                type="number"
                value={quantityDelta}
                onChange={(e) => setQuantityDelta(e.target.value)}
                className="mt-1 w-24"
                placeholder="+10 / -5"
                required
              />
            </div>
            <div className="min-w-[200px]">
              <Label>Шалтгаан</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1"
                placeholder="Жишээ: захиалга, буцаалт"
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Хадгалж байна...' : 'Хадгалах'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Бүтээгдэхүүний нөөц (одоогийн)</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-gray-500">Бүтээгдэхүүн байхгүй.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Нэр</TableHead>
                  <TableHead>Нөөц</TableHead>
                  <TableHead>Төлөв</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p: { id: string; name: string; stock_quantity: number; in_stock: boolean }) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.stock_quantity}</TableCell>
                    <TableCell>{p.in_stock ? 'Нөөцтэй' : 'Дууссан'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Хөдөлгөөний түүх</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Inventory movements нь audit_logs болон inventory_movements хүснэгтэд бүртгэгдэнэ. Дэлгэрэнгүйг Audit log хуудсаас харна уу.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
