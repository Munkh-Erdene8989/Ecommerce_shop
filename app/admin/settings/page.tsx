'use client'

import * as React from 'react'
import { useMutation, useQuery } from '@apollo/client'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { STORE_SETTINGS, UPDATE_STORE_SETTINGS } from '@/lib/admin/graphql'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminSettingsPage() {
  const { data, loading } = useQuery(STORE_SETTINGS)
  const [updateSettings, { loading: saving }] = useMutation(UPDATE_STORE_SETTINGS, {
    refetchQueries: [{ query: STORE_SETTINGS }],
  })

  const s = data?.storeSettings
  const [storeName, setStoreName] = React.useState(s?.store_name ?? '')
  const [logoUrl, setLogoUrl] = React.useState(s?.logo_url ?? '')
  const [shippingRate, setShippingRate] = React.useState(String(s?.shipping_rate ?? 5000))
  const [freeShippingThreshold, setFreeShippingThreshold] = React.useState(String(s?.free_shipping_threshold ?? 60000))
  const [taxRate, setTaxRate] = React.useState(String(s?.tax_rate ?? 0))

  React.useEffect(() => {
    if (s) {
      setStoreName(s.store_name ?? '')
      setLogoUrl(s.logo_url ?? '')
      setShippingRate(String(s.shipping_rate ?? 5000))
      setFreeShippingThreshold(String(s.free_shipping_threshold ?? 60000))
      setTaxRate(String(s.tax_rate ?? 0))
    }
  }, [s])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateSettings({
        variables: {
          input: {
            store_name: storeName,
            logo_url: logoUrl,
            shipping_rate: parseInt(shippingRate, 10),
            free_shipping_threshold: parseInt(freeShippingThreshold, 10),
            tax_rate: parseFloat(taxRate) || 0,
          },
        },
      })
      toast.success('Тохиргоо хадгалагдлаа')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Алдаа')
    }
  }

  if (loading && !s) return <Skeleton className="h-64 w-full" />

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Дэлгүүрийн тохиргоо</h1>
      <Card>
        <CardHeader>
          <CardTitle>Ерөнхий</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label>Дэлгүүрийн нэр</Label>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
            </div>
            <div>
              <Label>Лого URL</Label>
              <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>Хүргэлтийн үнэ (₮)</Label>
              <Input type="number" value={shippingRate} onChange={(e) => setShippingRate(e.target.value)} />
            </div>
            <div>
              <Label>Үнэгүй хүргэлтийн босго (₮)</Label>
              <Input type="number" value={freeShippingThreshold} onChange={(e) => setFreeShippingThreshold(e.target.value)} />
            </div>
            <div>
              <Label>Татварын хувь (0-100)</Label>
              <Input type="number" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Хадгалж байна...' : 'Хадгалах'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
