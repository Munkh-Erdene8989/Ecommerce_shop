'use client'

import { useState } from 'react'
import { useQuery } from '@apollo/client'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table'
import { ADMIN_CUSTOMERS, ADMIN_CUSTOMERS_TOTAL } from '@/lib/admin/graphql'
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
import { Button } from '@/components/ui/button'

const PAGE_SIZE = 10

export default function AdminCustomersPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })

  const { data, loading } = useQuery(ADMIN_CUSTOMERS, {
    variables: {
      paging: { limit: pagination.pageSize, offset: pagination.pageIndex * pagination.pageSize },
    },
  })
  const { data: totalData } = useQuery(ADMIN_CUSTOMERS_TOTAL)

  const customers = data?.adminCustomers ?? []
  const total = totalData?.adminCustomersTotal ?? 0
  const pageCount = Math.ceil(total / pagination.pageSize) || 1

  const columns: ColumnDef<{ id: string; email: string; full_name: string | null; phone: string | null; created_at: string; order_count?: number; total_spent?: number }>[] = [
    { accessorKey: 'email', header: 'Имэйл' },
    { accessorKey: 'full_name', header: 'Нэр' },
    { accessorKey: 'phone', header: 'Утас' },
    {
      accessorKey: 'order_count',
      header: 'Захиалга',
      cell: ({ getValue }) => getValue() ?? 0,
    },
    {
      accessorKey: 'total_spent',
      header: 'Нийт зарцуулсан',
      cell: ({ getValue }) => `${Number(getValue() ?? 0).toLocaleString()}₮`,
    },
    {
      accessorKey: 'created_at',
      header: 'Бүртгүүлсэн',
      cell: ({ getValue }) => new Date(String(getValue())).toLocaleDateString('mn-MN'),
    },
  ]

  const table = useReactTable({
    data: customers,
    columns,
    pageCount,
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Хэрэглэгчид</h1>
      <Card>
        <CardHeader>
          <CardTitle>Жагсаалт</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : customers.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Хэрэглэгч олдсонгүй.</div>
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
                <p className="text-sm text-gray-500">Нийт {total} хэрэглэгч</p>
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
