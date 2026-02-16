'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@apollo/client'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table'
import { ADMIN_PRODUCTS, ADMIN_PRODUCTS_TOTAL } from '@/lib/admin/graphql'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Plus, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

const PAGE_SIZE = 10

export default function AdminProductsPage() {
  const router = useRouter()
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filter = {
    ...(search ? { search } : {}),
    ...(statusFilter === 'in_stock' ? { in_stock: true } : statusFilter === 'out_of_stock' ? { in_stock: false } : {}),
  }

  const { data, loading } = useQuery(ADMIN_PRODUCTS, {
    variables: {
      paging: { limit: pagination.pageSize, offset: pagination.pageIndex * pagination.pageSize },
      filter: Object.keys(filter).length ? filter : undefined,
    },
  })

  const { data: totalData } = useQuery(ADMIN_PRODUCTS_TOTAL, {
    variables: { filter: Object.keys(filter).length ? filter : undefined },
  })

  const products = data?.adminProducts ?? []
  const total = totalData?.adminProductsTotal ?? 0
  const pageCount = Math.ceil(total / pagination.pageSize) || 1

  const columns: ColumnDef<{ id: string; name: string; slug: string; brand: string; category: string; price: number; stock_quantity: number; in_stock: boolean; is_featured: boolean; created_at: string; image: string }>[] = [
    {
      accessorKey: 'name',
      header: 'Нэр',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.image ? (
            <img src={row.original.image} alt="" className="h-8 w-8 rounded object-cover" />
          ) : null}
          <Link href={`/admin/products/${row.original.id}`} className="font-medium text-primary hover:underline">
            {row.original.name}
          </Link>
        </div>
      ),
    },
    { accessorKey: 'brand', header: 'Брэнд' },
    { accessorKey: 'category', header: 'Категори' },
    {
      accessorKey: 'price',
      header: 'Үнэ',
      cell: ({ getValue }) => `${Number(getValue()).toLocaleString()}₮`,
    },
    {
      accessorKey: 'stock_quantity',
      header: 'Нөөц',
      cell: ({ row }) => (
        <span className={row.original.in_stock ? '' : 'text-red-600'}>
          {row.original.stock_quantity}
        </span>
      ),
    },
    {
      accessorKey: 'is_featured',
      header: 'Онцлох',
      cell: ({ getValue }) => (getValue() ? <Badge variant="secondary">Тийм</Badge> : '—'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/products/${row.original.id}`}>Засах</Link>
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: products,
    columns,
    pageCount,
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Бүтээгдэхүүн</h1>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Шинэ
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Жагсаалт</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Хайх..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPagination((p) => ({ ...p, pageIndex: 0 }))
                }}
                className="pl-8 w-48"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }}
              className="h-9 rounded-md border border-gray-300 px-3 text-sm"
            >
              <option value="all">Бүгд</option>
              <option value="in_stock">Нөөцтэй</option>
              <option value="out_of_stock">Дууссан</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <p>Бүтээгдэхүүн олдсонгүй.</p>
              <Button variant="outline" className="mt-2" asChild>
                <Link href="/admin/products/new">Шинэ бүтээгдэхүүн нэмэх</Link>
              </Button>
            </div>
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
                <p className="text-sm text-gray-500">
                  Нийт {total} бүтээгдэхүүн
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Өмнөх
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
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
