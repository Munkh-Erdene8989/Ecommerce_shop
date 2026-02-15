'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/providers/AuthProvider'

interface EventAgg {
  event_name: string
  count: number
}

export default function AdminMarketingPage() {
  const { session } = useAuth()
  const [events, setEvents] = useState<EventAgg[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.access_token) return
    fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        query: `query { marketingEventCounts { event_name count } }`,
      }),
    })
      .then((r) => r.json())
      .then((data) => setEvents(data?.data?.marketingEventCounts ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [session?.access_token])

  if (loading) return <p>Ачааллаж байна...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Маркетинг үйл явдлууд</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">Үйл явдал</th>
              <th className="text-left p-3">Тоо</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.event_name} className="border-b hover:bg-gray-50">
                <td className="p-3">{e.event_name}</td>
                <td className="p-3">{e.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
