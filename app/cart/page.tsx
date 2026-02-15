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
        <h1 className="text-2xl font-bold mb-6">Сагс</h1>
        {cart.length === 0 ? (
          <>
            <p className="text-gray-600 mb-4">Сагс хоосон байна.</p>
            <Link href="/products" className="text-primary font-medium hover:underline">
              Бүтээгдэхүүн үзэх →
            </Link>
          </>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4 border rounded-lg p-4 items-center">
                  <Image src={item.image} alt={item.name} width={80} height={80} className="w-20 h-20 object-cover rounded" />
                  <div className="flex-1">
                    <Link href={item.slug ? `/products/${item.slug}` : '#'} className="font-medium hover:text-primary">
                      {item.name}
                    </Link>
                    <p className="text-primary font-semibold">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 border rounded"
                    >
                      −
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 border rounded"
                    >
                      +
                    </button>
                  </div>
                  <button type="button" onClick={() => removeFromCart(item.id)} className="text-red-600 hover:underline">
                    Устгах
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 max-w-sm">
              <p>Дэд дүн: {formatPrice(total)}</p>
              <p>Хүргэлт: {formatPrice(shipping)}</p>
              <p className="font-bold text-lg mt-2">Нийт: {formatPrice(grandTotal)}</p>
              <Link
                href="/checkout"
                className="mt-4 inline-block px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark"
              >
                Захиалах
              </Link>
            </div>
          </>
        )}
      </div>
      <Footer />
    </main>
  )
}
