 'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useAuth } from '@/lib/providers/AuthProvider'
import { useRouter } from 'next/navigation'

type ShippingAddress = {
  city: string
  district: string
  address: string
}

type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  shipping_city?: string | null
  shipping_district?: string | null
  shipping_address?: string | null
  created_at: string
  updated_at: string
}

export default function AccountProfilePage() {
  const { session } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [shipping, setShipping] = useState<ShippingAddress>({ city: '', district: '', address: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!session?.access_token) {
      router.push('/login?next=/account/profile')
      return
    }
    const controller = new AbortController()
    async function load() {
      try {
        const [profileRes, lastOrderRes] = await Promise.all([
          fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${session.access_token}` },
            signal: controller.signal,
          }),
          fetch('/api/graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              query: `query MyOrdersForProfile($paging: PagingInput) {
                myOrders(paging: $paging) {
                  id
                  shipping_address
                  created_at
                }
              }`,
              variables: { paging: { limit: 1, offset: 0 } },
            }),
            signal: controller.signal,
          }),
        ])

        let loadedProfile: Profile | null = null
        if (profileRes.ok) {
          const data = (await profileRes.json()) as Profile
          setProfile(data)
          loadedProfile = data
        }

        if (loadedProfile?.shipping_city || loadedProfile?.shipping_district || loadedProfile?.shipping_address) {
          setShipping({
            city: loadedProfile.shipping_city ?? '',
            district: loadedProfile.shipping_district ?? '',
            address: loadedProfile.shipping_address ?? '',
          })
        } else if (lastOrderRes.ok) {
          const data = await lastOrderRes.json()
          const orders = data?.data?.myOrders ?? []
          if (Array.isArray(orders) && orders.length > 0) {
            const addr = (orders[0].shipping_address ?? {}) as Partial<ShippingAddress>
            setShipping({
              city: String(addr.city ?? ''),
              district: String(addr.district ?? ''),
              address: String(addr.address ?? ''),
            })
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [session?.access_token, router])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.access_token || !profile) return
    setSaving(true)
    try {
      await fetch('/api/auth/upsert-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          phone: profile.phone,
          shipping_city: shipping.city,
          shipping_district: shipping.district,
          shipping_address: shipping.address,
        }),
      })
      // shipping address is stored per-order, so we don't persist it separately here
    } finally {
      setSaving(false)
    }
  }

  const displayName = profile?.full_name && profile.full_name.trim().length > 0 ? profile.full_name : profile?.email ?? ''

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="container py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Миний профайл</h1>
        {loading ? (
          <p>Ачааллаж байна...</p>
        ) : !profile ? (
          <p className="text-gray-600">Профайл мэдээлэл олдсонгүй.</p>
        ) : (
          <>
            <section className="mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xl">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-lg">{displayName}</p>
                  <p className="text-sm text-gray-600">{profile.email}</p>
                </div>
              </div>
            </section>
            <section className="mb-10">
              <h2 className="text-lg font-semibold mb-4">Хувийн мэдээлэл</h2>
              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Овог, нэр</label>
                  <input
                    type="text"
                    value={profile.full_name ?? ''}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Имэйл</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Утасны дугаар</label>
                  <input
                    type="tel"
                    value={profile.phone ?? ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Хүргэлтийн хаяг</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Хот"
                      value={shipping.city}
                      onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Дүүрэг"
                      value={shipping.district}
                      onChange={(e) => setShipping({ ...shipping, district: e.target.value })}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Дэлгэрэнгүй хаяг"
                      value={shipping.address}
                      onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Сүүлийн захиалгын хүргэлтийн хаяг автоматаар дүүрсэн. Шинэ захиалга хийхдээ эндээс хуулж ашиглаж болно.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? 'Хадгалж байна...' : 'Мэдээлэл хадгалах'}
                </button>
              </form>
            </section>
          </>
        )}
      </div>
      <Footer />
    </main>
  )
}

