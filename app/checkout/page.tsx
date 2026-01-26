'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useCart } from '@/contexts/CartContext'
import { formatPrice } from '@/lib/products'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const { cart, getTotal, clearCart } = useCart()
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    district: '',
    address: '',
    postalCode: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVV: '',
  })

  const subtotal = getTotal()
  const shippingCost = subtotal >= 60000 ? 0 : 5000
  const total = subtotal + shippingCost

  useEffect(() => {
    if (cart.length === 0) {
      router.push('/cart')
    }
  }, [cart, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (paymentMethod === 'card') {
      if (!formData.cardNumber || !formData.cardExpiry || !formData.cardCVV) {
        alert('Картын мэдээлэл оруулна уу')
        return
      }
    }

    // Save order
    const order = {
      id: Date.now(),
      ...formData,
      items: cart,
      total,
      date: new Date().toISOString(),
      status: 'pending',
    }
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]')
    orders.push(order)
    localStorage.setItem('orders', JSON.stringify(orders))
    
    clearCart()
    router.push(`/order-success?orderId=${order.id}`)
  }

  if (cart.length === 0) {
    return null
  }

  return (
    <main>
      <Header />
      <div className="bg-gray-100 py-3">
        <div className="container mx-auto px-5">
          <Link href="/" className="text-gray-600 hover:text-primary">Нүүр</Link> /{' '}
          <Link href="/cart" className="text-gray-600 hover:text-primary">Сагс</Link> / <span>Захиалга хийх</span>
        </div>
      </div>

      <section className="py-10">
        <div className="container mx-auto px-5">
          <h1 className="text-3xl font-bold mb-8">Захиалга хийх</h1>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold">Имэйл *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold">Утас *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

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
                        className="w-full px-4 py-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold">Дүүрэг *</label>
                      <input
                        type="text"
                        required
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block mb-2 font-semibold">Дэлгэрэнгүй хаяг *</label>
                      <textarea
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Төлбөрийн арга</h2>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded cursor-pointer hover:border-primary">
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5"
                      />
                      <span>Банкны карт</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded cursor-pointer hover:border-primary">
                      <input
                        type="radio"
                        name="payment"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5"
                      />
                      <span>Бэлэн мөнгө (хүргэлтээр)</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded cursor-pointer hover:border-primary">
                      <input
                        type="radio"
                        name="payment"
                        value="bank"
                        checked={paymentMethod === 'bank'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5"
                      />
                      <span>Банкны шилжүүлэг</span>
                    </label>
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="mt-6 space-y-4">
                      <div>
                        <label className="block mb-2 font-semibold">Картын дугаар *</label>
                        <input
                          type="text"
                          required={paymentMethod === 'card'}
                          value={formData.cardNumber}
                          onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-4 py-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-2 font-semibold">Хүчинтэй хугацаа *</label>
                          <input
                            type="text"
                            required={paymentMethod === 'card'}
                            value={formData.cardExpiry}
                            onChange={(e) => setFormData({ ...formData, cardExpiry: e.target.value })}
                            placeholder="MM/YY"
                            className="w-full px-4 py-2 border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block mb-2 font-semibold">CVV *</label>
                          <input
                            type="text"
                            required={paymentMethod === 'card'}
                            value={formData.cardCVV}
                            onChange={(e) => setFormData({ ...formData, cardCVV: e.target.value })}
                            placeholder="123"
                            className="w-full px-4 py-2 border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-white py-4 rounded font-bold hover:bg-secondary transition"
                >
                  Захиалга баталгаажуулах
                </button>
              </form>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 h-fit sticky top-24">
              <h2 className="text-xl font-bold mb-6">Захиалгын хураангуй</h2>
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-200">
                    <div className="relative w-16 h-16 bg-gray-100 rounded">
                      <Image src={item.image} alt={item.name} fill className="object-cover rounded" />
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
                  <span>{formatPrice(shippingCost)}</span>
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
