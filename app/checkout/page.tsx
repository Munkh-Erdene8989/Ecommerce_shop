'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/lib/providers/AuthProvider'
import { formatPrice } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const { cart, getTotal, clearCart } = useCart()
  const { user, session } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [qpay, setQpay] = useState<{ qr_image: string; urls: { name: string; link: string }[]; orderId: string } | null>(null)
  const [checking, setChecking] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: 'Улаанбаатар', district: '', address: '' })

  const subtotal = getTotal()
  const shipping = subtotal >= 60000 ? 0 : 5000
  const total = subtotal + shipping

  useEffect(() => {
    if (!user && !session) return
    setForm((f) => ({
      ...f,
      email: user?.email ?? f.email,
      name: (user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? '') || f.name,
    }))
  }, [user, session])

  useEffect(() => {
    if (cart.length === 0 && !qpay) router.push('/cart')
  }, [cart, qpay, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !session) {
      router.push('/login?next=/checkout')
      return
    }
    setLoading(true)
    try {
      const token = session.access_token
      const createRes = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          query: `mutation CreateOrder($input: CreateOrderInput!) {
            createOrder(input: $input) { id }
          }`,
          variables: {
            input: {
              user_id: user.id,
              subtotal,
              shipping_cost: shipping,
              total,
              payment_method: 'qpay',
              shipping_address: { city: form.city, district: form.district, address: form.address },
              customer_info: { name: form.name, email: form.email, phone: form.phone },
              items: cart.map((i) => ({
                product_id: i.id,
                product_name: i.name,
                quantity: i.quantity,
                price: i.price,
              })),
            },
          },
        }),
      })
      const createJson = await createRes.json()
      const orderId = createJson?.data?.createOrder?.id
      if (!orderId) throw new Error(createJson?.errors?.[0]?.message ?? 'Order create failed')

      const payRes = await fetch('/api/payments/qpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, amount: total, description: `AZ Beauty #${orderId.slice(0, 8)}` }),
      })
      const payData = await payRes.json()
      if (!payRes.ok) throw new Error(payData.error ?? 'QPay create failed')
      setQpay({
        qr_image: payData.qr_image ?? '',
        urls: payData.urls ?? [],
        orderId,
      })
      clearCart()
      const interval = setInterval(async () => {
        setChecking(true)
        const checkRes = await fetch(`/api/payments/qpay/check?invoice_id=${payData.invoice_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const checkData = await checkRes.json()
        setChecking(false)
        if (checkData.status === 'PAID') {
          clearInterval(interval)
          router.push(`/checkout/success?order_id=${orderId}`)
        }
      }, 4000)
      setTimeout(() => clearInterval(interval), 120000)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  if (qpay) {
    return (
      <main className="min-h-screen flex flex-col">
        <Header />
        <div className="container py-8 max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">QPay-аар төлөх</h1>
          {qpay.qr_image && <Image src={qpay.qr_image} alt="QR" width={256} height={256} className="mx-auto mb-4" unoptimized />}
          <p className="text-gray-600 mb-4">{checking ? 'Төлбөр шалгаж байна...' : 'QR кодыг уншуулна уу.'}</p>
          <div className="space-y-2">
            {qpay.urls.map((u) => (
              <a key={u.name} href={u.link} target="_blank" rel="noopener noreferrer" className="block text-primary hover:underline">
                {u.name}
              </a>
            ))}
          </div>
          <Link href={`/checkout/success?order_id=${qpay.orderId}`} className="mt-6 inline-block text-primary hover:underline">
            Төлбөр төлсөн бол энд дарна уу
          </Link>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Захиалга</h1>
        <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Нэр</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Имэйл</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Утас</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Хот</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Дүүрэг / Хаяг</label>
            <input
              type="text"
              value={form.district}
              onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
              placeholder="Дүүрэг"
              className="w-full border rounded-lg px-4 py-2 mb-2"
            />
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Дэлгэрэнгүй хаяг"
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>
          <p className="font-medium">Нийт: {formatPrice(total)}</p>
          <button
            type="submit"
            disabled={loading || cart.length === 0}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? 'Бэлтгэж байна...' : 'QPay-аар төлөх'}
          </button>
        </form>
      </div>
      <Footer />
    </main>
  )
}
