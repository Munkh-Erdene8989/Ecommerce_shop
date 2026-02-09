'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/lib/providers/AuthProvider'
import { useCreateOrder } from '@/lib/hooks/use-orders'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function CheckoutPage() {
  const { cart, getTotal, clearCart } = useCart()
  const { user } = useAuth()
  const createOrder = useCreateOrder()
  const router = useRouter()

  const [paymentMethod, setPaymentMethod] = useState('qpay')
  const [loading, setLoading] = useState(false)
  const [qpayData, setQpayData] = useState<{
    qr_image: string
    urls: Array<{ name: string; logo: string; link: string }>
    orderId: string
  } | null>(null)
  const [checkingPayment, setCheckingPayment] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: 'Улаанбаатар',
    district: '',
    address: '',
  })

  const subtotal = getTotal()
  const shippingCost = subtotal >= 60000 ? 0 : 5000
  const total = subtotal + shippingCost

  useEffect(() => {
    if (cart.length === 0 && !qpayData) {
      router.push('/cart')
    }
  }, [cart, router, qpayData])

  // Auto-fill user info
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || prev.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || prev.name,
      }))
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!user) {
        router.push('/login')
        return
      }

      // Create order in Supabase
      const order = await createOrder.mutateAsync({
        order: {
          user_id: user.id,
          total,
          subtotal,
          shipping_cost: shippingCost,
          payment_method: paymentMethod,
          shipping_address: {
            city: formData.city,
            district: formData.district,
            address: formData.address,
          },
          customer_info: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          },
        },
        items: cart.map((item) => ({
          product_id: item.id.toString(),
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      })

      if (paymentMethod === 'qpay') {
        // Create QPay invoice
        const response = await axios.post('/api/qpay/create-invoice', {
          orderId: order.id,
          amount: total,
          description: `AZ Beauty захиалга #${order.id.slice(0, 8)}`,
        })

        setQpayData({
          qr_image: response.data.qr_image,
          urls: response.data.urls || [],
          orderId: order.id,
        })

        // Start polling for payment
        startPaymentCheck(order.id)
      } else if (paymentMethod === 'cash') {
        clearCart()
        router.push(`/order-success?orderId=${order.id}`)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Захиалга хийхэд алдаа гарлаа. Дахин оролдоно уу.')
    } finally {
      setLoading(false)
    }
  }

  const startPaymentCheck = (orderId: string) => {
    setCheckingPayment(true)
    const interval = setInterval(async () => {
      try {
        const response = await axios.post('/api/qpay/check', { orderId })
        if (response.data.status === 'paid') {
          clearInterval(interval)
          setCheckingPayment(false)
          clearCart()
          router.push(`/order-success?orderId=${orderId}`)
        }
      } catch {
        // Continue polling
      }
    }, 5000)

    // Stop checking after 10 minutes
    setTimeout(() => {
      clearInterval(interval)
      setCheckingPayment(false)
    }, 600000)
  }

  if (cart.length === 0 && !qpayData) {
    return null
  }

  // QPay Payment Modal
  if (qpayData) {
    return (
      <main>
        <Header />
        <section className="py-10">
          <div className="container mx-auto px-5 max-w-lg">
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">QPay төлбөр</h2>
              <p className="text-gray-600 mb-6">
                Доорх QR кодыг банкны апп-аар уншуулна уу
              </p>

              {/* QR Code */}
              {qpayData.qr_image && (
                <div className="mb-6">
                  <img
                    src={`data:image/png;base64,${qpayData.qr_image}`}
                    alt="QPay QR Code"
                    className="mx-auto w-64 h-64"
                  />
                </div>
              )}

              {/* Amount */}
              <div className="text-2xl font-bold text-primary mb-6">
                {formatPrice(total)}
              </div>

              {/* Bank Links */}
              {qpayData.urls && qpayData.urls.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-3">Банкны апп сонгох:</p>
                  <div className="grid grid-cols-4 gap-3">
                    {qpayData.urls.map((url, i) => (
                      <a
                        key={i}
                        href={url.link}
                        className="flex flex-col items-center p-2 border border-gray-200 rounded-lg hover:border-primary transition"
                      >
                        <img src={url.logo} alt={url.name} className="w-10 h-10 mb-1" />
                        <span className="text-xs">{url.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              {checkingPayment && (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Төлбөр хүлээж байна...</span>
                </div>
              )}

              <Link
                href="/"
                className="inline-block mt-6 text-sm text-gray-500 hover:text-gray-700"
              >
                Нүүр хуудас руу буцах
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  return (
    <main>
      <Header />
      <div className="bg-gray-100 py-3">
        <div className="container mx-auto px-5">
          <Link href="/" className="text-gray-600 hover:text-primary">
            Нүүр
          </Link>{' '}
          /{' '}
          <Link href="/cart" className="text-gray-600 hover:text-primary">
            Сагс
          </Link>{' '}
          / <span>Захиалга хийх</span>
        </div>
      </div>

      {!user && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="container mx-auto px-5 py-3 flex items-center justify-between">
            <span className="text-sm text-yellow-800">
              Захиалга хийхийн тулд нэвтрэх шаардлагатай
            </span>
            <Link
              href="/login"
              className="text-sm bg-primary text-white px-4 py-1 rounded hover:bg-secondary transition"
            >
              Нэвтрэх
            </Link>
          </div>
        </div>
      )}

      <section className="py-10">
        <div className="container mx-auto px-5">
          <h1 className="text-3xl font-bold mb-8">Захиалга хийх</h1>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Info */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Худалдан авагчийн мэдээлэл</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 font-semibold">Нэр *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold">Имэйл *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold">Утас *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Хүргэх хаяг</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 font-semibold">Хот *</label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold">Дүүрэг *</label>
                      <input
                        type="text"
                        required
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block mb-2 font-semibold">Дэлгэрэнгүй хаяг *</label>
                      <textarea
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Төлбөрийн арга</h2>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary transition">
                      <input
                        type="radio"
                        name="payment"
                        value="qpay"
                        checked={paymentMethod === 'qpay'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5"
                      />
                      <div>
                        <span className="font-medium">QPay</span>
                        <p className="text-xs text-gray-500">
                          Бүх банкны апп-аар QR код уншуулж төлөх
                        </p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary transition">
                      <input
                        type="radio"
                        name="payment"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5"
                      />
                      <div>
                        <span className="font-medium">Бэлэн мөнгө</span>
                        <p className="text-xs text-gray-500">Хүргэлтээр бэлнээр төлөх</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary transition">
                      <input
                        type="radio"
                        name="payment"
                        value="bank"
                        checked={paymentMethod === 'bank'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5"
                      />
                      <div>
                        <span className="font-medium">Банкны шилжүүлэг</span>
                        <p className="text-xs text-gray-500">Дансны дугаар руу шилжүүлэх</p>
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !user}
                  className="w-full bg-primary text-white py-4 rounded font-bold hover:bg-secondary transition disabled:opacity-50"
                >
                  {loading ? 'Захиалга хийж байна...' : 'Захиалга баталгаажуулах'}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 h-fit sticky top-24">
              <h2 className="text-xl font-bold mb-6">Захиалгын хураангуй</h2>
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-200">
                    <div className="relative w-16 h-16 bg-gray-100 rounded">
                      <Image src={item.image} alt={item.name} fill className="object-cover rounded" unoptimized />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-primary font-semibold">
                        {formatPrice(item.price)} x {item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Бүтээгдэхүүний үнэ:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Хүргэлт:</span>
                  <span>{shippingCost === 0 ? 'Үнэгүй' : formatPrice(shippingCost)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-xl font-bold">
                  <span>Нийт:</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
