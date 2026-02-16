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
import { ADMIN_AUDIT_LOGS, ADMIN_AUDIT_LOGS_TOTAL } from '@/lib/admin/graphql'
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

const PAGE_SIZE = 20

export default function AdminAuditPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const [entityFilter, setEntityFilter] = useState('')

  const { data, loading } = useQuery(ADMIN_AUDIT_LOGS, {
    variables: {
      paging: { limit: pagination.pageSize, offset: pagination.pageIndex * pagination.pageSize },
      entity_type: entityFilter || undefined,
    },
  })
  const { data: totalData } = useQuery(ADMIN_AUDIT_LOGS_TOTAL, {
    variables: { entity_type: entityFilter || undefined },
  })

  const logs = data?.adminAuditLogs ?? []
  const total = totalData?.adminAuditLogsTotal ?? 0
  const pageCount = Math.ceil(total / pagination.pageSize) || 1

  const columns: ColumnDef<{ id: string; user_id: string | null; action: string; entity_type: string; entity_id: string | null; created_at: string }>[] = [
    {
      accessorKey: 'created_at',
      header: 'Огноо',
      cell: ({ getValue }) => new Date(String(getValue())).toLocaleString('mn-MN'),
    },
    { accessorKey: 'action', header: 'Үйлдэл' },
    { accessorKey: 'entity_type', header: 'Төрөл' },
    { accessorKey: 'entity_id', header: 'ID', cell: ({ getValue }) => getValue() ? String(getValue()).slice(0, 8) + '…' : '—' },
    { accessorKey: 'user_id', header: 'Хэрэглэгч', cell: ({ getValue }) => getValue() ? String(getValue()).slice(0, 8) + '…' : '—' },
  ]

  const table = useReactTable({
    data: logs,
    columns,
    pageCount,
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit log</h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Үйлдлийн түүх</CardTitle>
          <select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
            className="h-9 rounded-md border border-gray-300 px-3 text-sm"
          >
            <option value="">Бүгд</option>
            <option value="product">Бүтээгдэхүүн</option>
            <option value="inventory_movement">Нөөц</option>
          </select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Бичлэг олдсонгүй.</div>
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
    </div>
  )
}
