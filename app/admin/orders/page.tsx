'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery } from '@apollo/client'
import toast from 'react-hot-toast'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table'
import { ADMIN_ORDERS, ADMIN_ORDERS_TOTAL, UPDATE_ORDER_STATUS } from '@/lib/admin/graphql'
import { ORDER_STATUSES } from '@/lib/shared'
import { Button } from '@/components/ui/button'
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
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PAGE_SIZE = 10

function StatusSelectCell({ orderId, initialStatus }: { orderId: string; initialStatus: string }) {
  const [value, setValue] = useState(initialStatus)
  const [updateStatus, { loading }] = useMutation(UPDATE_ORDER_STATUS)

  const handleChange = async (newStatus: string) => {
    const prev = value
    setValue(newStatus)
    try {
      await updateStatus({
        variables: {
          input: { order_id: orderId, status: newStatus },
        },
      })
      toast.success('Хүргэлтийн статус шинэчлэгдлээ')
    } catch (e) {
      setValue(prev)
      toast.error(e instanceof Error ? e.message : 'Алдаа гарлаа')
    }
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={loading}>
      <SelectTrigger className="h-8 w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default function AdminOrdersPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data, loading } = useQuery(ADMIN_ORDERS, {
    variables: {
      paging: { limit: pagination.pageSize, offset: pagination.pageIndex * pagination.pageSize },
      status: statusFilter,
    },
  })

  const { data: totalData } = useQuery(ADMIN_ORDERS_TOTAL, {
    variables: { status: statusFilter },
  })

  const orders = data?.adminOrders ?? []
  const total = totalData?.adminOrdersTotal ?? 0
  const pageCount = Math.ceil(total / pagination.pageSize) || 1

  const columns: ColumnDef<{ id: string; total: number; status: string; payment_status: string; created_at: string; customer_info: Record<string, unknown> }>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <Link href={`/admin/orders/${row.original.id}`} className="font-mono text-primary hover:underline">
          {String(row.original.id).slice(0, 8)}…
        </Link>
      ),
    },
    {
      accessorKey: 'customer_info',
      header: 'Харилцагч',
      cell: ({ row }) => {
        const info = row.original.customer_info as { email?: string; full_name?: string } | null
        return info?.email ?? info?.full_name ?? '—'
      },
    },
    {
      accessorKey: 'total',
      header: 'Дүн',
      cell: ({ getValue }) => `${Number(getValue()).toLocaleString()}₮`,
    },
    {
      accessorKey: 'status',
      header: 'Хүргэлтийн төлөв',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{String(row.original.status)}</Badge>
          <StatusSelectCell orderId={row.original.id} initialStatus={row.original.status} />
        </div>
      ),
    },
    {
      accessorKey: 'payment_status',
      header: 'Төлбөр',
      cell: ({ getValue }) => <Badge variant={getValue() === 'paid' ? 'success' : 'secondary'}>{String(getValue())}</Badge>,
    },
    {
      accessorKey: 'created_at',
      header: 'Огноо',
      cell: ({ getValue }) => new Date(String(getValue())).toLocaleDateString('mn-MN'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/orders/${row.original.id}`}>Дэлгэрэнгүй</Link>
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: orders,
    columns,
    pageCount,
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Захиалга</h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Жагсаалт</CardTitle>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPagination((p) => ({ ...p, pageIndex: 0 }))
            }}
            className="h-9 rounded-md border border-gray-300 px-3 text-sm"
          >
            <option value="all">Бүгд</option>
            <option value="pending">Хүлээгдэж буй</option>
            <option value="paid">Төлөгдсөн</option>
            <option value="processing">Бэлтгэж буй</option>
            <option value="shipped">Илгээгдсэн</option>
            <option value="delivered">Хүргэгдсэн</option>
            <option value="cancelled">Цуцлагдсан</option>
          </select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Захиалга олдсонгүй.</div>
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
              <div className="flex items-center justify-between border-t pt-4">
                <p className="text-sm text-gray-500">Нийт {total} захиалга</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                    Өмнөх
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    Дараах
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
