'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import toast from 'react-hot-toast'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table'
import { ADMIN_COUPONS, ADMIN_COUPONS_TOTAL } from '@/lib/admin/graphql'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

const CREATE_COUPON = gql`
  mutation CreateCoupon($input: CreateCouponInput!) {
    createCoupon(input: $input) {
      id
      code
    }
  }
`

const UPDATE_COUPON = gql`
  mutation UpdateCoupon($input: UpdateCouponInput!) {
    updateCoupon(input: $input) {
      id
      code
    }
  }
`

const DELETE_COUPON = gql`
  mutation DeleteCoupon($id: ID!) {
    deleteCoupon(id: $id)
  }
`

const PAGE_SIZE = 10

export default function AdminCouponsPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, loading, refetch } = useQuery(ADMIN_COUPONS, {
    variables: { paging: { limit: pagination.pageSize, offset: pagination.pageIndex * pagination.pageSize } },
  })
  const { data: totalData } = useQuery(ADMIN_COUPONS_TOTAL)

  const coupons = data?.adminCoupons ?? []
  const total = totalData?.adminCouponsTotal ?? 0
  const pageCount = Math.ceil(total / pagination.pageSize) || 1

  const [createCoupon, { loading: creating }] = useMutation(CREATE_COUPON, {
    onCompleted: () => { refetch(); setCreateOpen(false); toast.success('Купон нэмэгдлээ'); },
    onError: (e) => toast.error(e.message),
  })
  const [deleteCoupon, { loading: deleting }] = useMutation(DELETE_COUPON, {
    onCompleted: () => { refetch(); setDeleteId(null); toast.success('Устгагдлаа'); },
    onError: (e) => toast.error(e.message),
  })

  const columns: ColumnDef<{ id: string; code: string; type: string; value: number; min_order_amount: number | null; max_uses: number | null; used_count: number; valid_from: string | null; valid_until: string | null }>[] = [
    { accessorKey: 'code', header: 'Код' },
    { accessorKey: 'type', header: 'Төрөл' },
    { accessorKey: 'value', header: 'Утга' },
    {
      accessorKey: 'min_order_amount',
      header: 'Min захиалга',
      cell: ({ getValue }) => (getValue() != null ? `${Number(getValue()).toLocaleString()}₮` : '—'),
    },
    {
      accessorKey: 'used_count',
      header: 'Ашигласан',
    },
    {
      accessorKey: 'max_uses',
      header: 'Дээд тоо',
      cell: ({ getValue }) => getValue() ?? '—',
    },
    {
      accessorKey: 'valid_until',
      header: 'Хүчинтэй',
      cell: ({ getValue }) => (getValue() ? new Date(String(getValue())).toLocaleDateString() : '—'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button variant="destructive" size="sm" onClick={() => setDeleteId(row.original.id)}>
          Устгах
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: coupons,
    columns,
    pageCount,
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Купон</h1>
        <Button onClick={() => setCreateOpen(true)}>Шинэ купон</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Жагсаалт</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : coupons.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Купон олдсонгүй.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((h) => (
                        <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between border-t pt-4">
                <p className="text-sm text-gray-500">Нийт {total}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Өмнөх</Button>
                  <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Дараах</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Шинэ купон</DialogTitle>
          </DialogHeader>
          <CreateCouponForm
            onSubmit={(input) => createCoupon({ variables: { input } })}
            loading={creating}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Купон устгах</DialogTitle>
            <DialogDescription>Итгэлтэй байна уу? Энэ үйлдлийг буцааж болохгүй.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Цуцлах</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteCoupon({ variables: { id: deleteId } })} disabled={deleting}>
              {deleting ? 'Устгаж байна...' : 'Устгах'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CreateCouponForm({
  onSubmit,
  loading,
  onCancel,
}: {
  onSubmit: (input: { code: string; type: string; value: number; min_order_amount?: number; max_uses?: number }) => void
  loading: boolean
  onCancel: () => void
}) {
  const [code, setCode] = useState('')
  const [type, setType] = useState<'percent' | 'fixed'>('percent')
  const [value, setValue] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [maxUses, setMaxUses] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const v = parseInt(value, 10)
    if (!code.trim() || isNaN(v) || v < 0) return
    onSubmit({
      code: code.trim(),
      type,
      value: v,
      min_order_amount: minOrder ? parseInt(minOrder, 10) : undefined,
      max_uses: maxUses ? parseInt(maxUses, 10) : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Код *</Label>
        <Input value={code} onChange={(e) => setCode(e.target.value)} required />
      </div>
      <div>
        <Label>Төрөл</Label>
        <select value={type} onChange={(e) => setType(e.target.value as 'percent' | 'fixed')} className="w-full rounded-md border px-3 py-2">
          <option value="percent">Хувь (%)</option>
          <option value="fixed">Тогтмол (₮)</option>
        </select>
      </div>
      <div>
        <Label>Утга *</Label>
        <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} required />
      </div>
      <div>
        <Label>Min захиалгын дүн (₮)</Label>
        <Input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
      </div>
      <div>
        <Label>Дээд ашиглалтын тоо</Label>
        <Input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Цуцлах</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Хадгалж байна...' : 'Нэмэх'}</Button>
      </DialogFooter>
    </form>
  )
}
