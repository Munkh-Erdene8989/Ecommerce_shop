'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import { formatPrice } from '@/lib/utils'

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, getTotal } = useCart()
  const total = getTotal()
  const shipping = total >= 60000 ? 0 : 5000
  const grandTotal = total + shipping

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="container py-8">
        <h1 className="text-2xl md:text-3xl font-semibold mb-8 text-stone-900">Сагс</h1>
        {cart.length === 0 ? (
          <div className="card p-8 md:p-12 text-center max-w-md mx-auto">
            <p className="text-stone-600 mb-4">Сагс хоосон байна.</p>
            <Link href="/products" className="btn-primary inline-flex">
              Бүтээгдэхүүн үзэх
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="card p-4 flex flex-col sm:flex-row gap-4 items-center">
                  <Link href={item.slug ? `/products/${item.slug}` : '#'} className="shrink-0 rounded-lg overflow-hidden w-20 h-20">
                    <Image src={item.image} alt={item.name} width={80} height={80} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <Link
                      href={item.slug ? `/products/${item.slug}` : '#'}
                      className="font-medium text-stone-900 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded transition-colors"
                    >
                      {item.name}
                    </Link>
                    <p className="font-semibold mt-0.5" style={{ color: 'var(--primary)' }}>{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-9 h-9 rounded-full border border-stone-300 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors font-medium"
                      aria-label="Тоо бууруулах"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-medium text-stone-900">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-9 h-9 rounded-full border border-stone-300 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors font-medium"
                      aria-label="Тоо нэмэх"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 text-sm font-medium"
                  >
                    Устгах
                  </button>
                </div>
              ))}
            </div>
            <div className="lg:w-80 shrink-0">
              <div className="card p-5 sticky top-24">
                <h3 className="font-semibold text-stone-900 mb-4">Захиалгын дүн</h3>
                <div className="space-y-2 text-stone-600">
                  <p className="flex justify-between">
                    <span>Дэд дүн</span>
                    <span>{formatPrice(total)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Хүргэлт</span>
                    <span>{formatPrice(shipping)}</span>
                  </p>
                </div>
                <p className="flex justify-between font-bold text-lg text-stone-900 mt-4 pt-4 border-t border-stone-200">
                  <span>Нийт</span>
                  <span>{formatPrice(grandTotal)}</span>
                </p>
                <Link href="/checkout" className="btn-primary w-full mt-5 flex justify-center">
                  Захиалах
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
