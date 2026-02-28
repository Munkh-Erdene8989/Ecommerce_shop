'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@apollo/client'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table'
import {
  ADMIN_MARKETING_EVENTS,
  ADMIN_MARKETING_EVENTS_TOTAL,
  MARKETING_EVENT_COUNTS,
} from '@/lib/admin/graphql'
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

const PAGE_SIZE = 20
const FUNNEL_STEPS = ['page_view', 'view_product', 'add_to_cart', 'begin_checkout', 'purchase']

export default function AdminMarketingPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const [eventFilter, setEventFilter] = useState('')
  const [utmCampaign, setUtmCampaign] = useState('')

  const { data: countsData } = useQuery(MARKETING_EVENT_COUNTS, { variables: { range: '30d' } })
  const { data, loading } = useQuery(ADMIN_MARKETING_EVENTS, {
    variables: {
      paging: { limit: pagination.pageSize, offset: pagination.pageIndex * pagination.pageSize },
      event_name: eventFilter || undefined,
      utm_campaign: utmCampaign || undefined,
    },
  })
  const { data: totalData } = useQuery(ADMIN_MARKETING_EVENTS_TOTAL, {
    variables: { event_name: eventFilter || undefined, utm_campaign: utmCampaign || undefined },
  })

  const events = data?.adminMarketingEvents ?? []
  const total = totalData?.adminMarketingEventsTotal ?? 0
  const pageCount = Math.ceil(total / pagination.pageSize) || 1
  const counts = countsData?.marketingEventCounts ?? []
  const countMap = useMemo(() => {
    const m: Record<string, number> = {}
    counts.forEach((c: { event_name: string; count: number }) => { m[c.event_name] = c.count })
    return m
  }, [counts])

  const funnelData = useMemo(() => {
    return FUNNEL_STEPS.map((step) => ({
      step,
      count: countMap[step] ?? 0,
    }))
  }, [countMap])

  const columns: ColumnDef<{ id: string; event_name: string; page: string | null; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; value: number | null; created_at: string }>[] = [
    { accessorKey: 'event_name', header: 'Үйлдэл' },
    { accessorKey: 'page', header: 'Хуудас' },
    { accessorKey: 'utm_source', header: 'UTM source' },
    { accessorKey: 'utm_medium', header: 'UTM medium' },
    { accessorKey: 'utm_campaign', header: 'UTM campaign' },
    {
      accessorKey: 'value',
      header: 'Утга',
      cell: ({ getValue }) => (getValue() != null ? Number(getValue()).toLocaleString() : '—'),
    },
    {
      accessorKey: 'created_at',
      header: 'Огноо',
      cell: ({ getValue }) => new Date(String(getValue())).toLocaleString('mn-MN'),
    },
  ]

  const table = useReactTable({
    data: events,
    columns,
    pageCount,
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  })

  const exportCsv = () => {
    const headers = ['event_name', 'page', 'utm_source', 'utm_medium', 'utm_campaign', 'value', 'created_at']
    const rows = events.map((e: Record<string, unknown>) =>
      headers.map((h) => (e[h] != null ? String(e[h]) : '')).join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `marketing-events-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold sm:text-2xl">Маркетинг</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-base">Funnel (сүүлийн 30 хоног)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !counts.length ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-4">
              {funnelData.map(({ step, count }) => (
                <div key={step} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 sm:px-4">
                  <p className="truncate text-xs text-gray-500 sm:text-sm">{step}</p>
                  <p className="text-lg font-semibold sm:text-xl">{count}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-2">
          <CardTitle className="text-lg sm:text-base">UTM / Үйл явдлууд</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              placeholder="Event name"
              value={eventFilter}
              onChange={(e) => { setEventFilter(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
              className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm sm:w-40"
            />
            <input
              placeholder="UTM campaign"
              value={utmCampaign}
              onChange={(e) => { setUtmCampaign(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
              className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm sm:w-40"
            />
            <Button variant="outline" size="sm" onClick={exportCsv} className="w-full sm:w-auto">
              CSV татах
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : events.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Үйл явдал олдсонгүй.</div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-2 sm:mx-0">
              <Table className="min-w-[680px]">
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
              </div>
              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
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
