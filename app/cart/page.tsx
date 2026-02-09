'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useCart } from '@/contexts/CartContext'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, getTotal } = useCart()
  const router = useRouter()

  const subtotal = getTotal()
  const shippingCost = subtotal >= 60000 ? 0 : 5000
  const total = subtotal + shippingCost

  if (cart.length === 0) {
    return (
      <main>
        <Header />
        <div className="bg-gray-100 py-3">
          <div className="container mx-auto px-5">
            <Link href="/" className="text-gray-600 hover:text-primary">
              Нүүр
            </Link>{' '}
            / <span>Сагс</span>
          </div>
        </div>
        <section className="py-20">
          <div className="container mx-auto px-5 text-center">
            <div className="text-6xl mb-6">🛍️</div>
            <h2 className="text-2xl font-bold mb-4">Таны сагс хоосон байна</h2>
            <p className="text-gray-600 mb-8">Дэлгүүр рүү очиж бүтээгдэхүүн сонгоно уу</p>
            <Link
              href="/products"
              className="inline-block bg-primary text-white px-10 py-4 rounded-full font-bold hover:shadow-lg transition"
            >
              Дэлгүүр рүү очих
            </Link>
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
          / <span>Сагс</span>
        </div>
      </div>

      <section className="py-10">
        <div className="container mx-auto px-5">
          <h1 className="text-3xl font-bold mb-8">Таны сагс</h1>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-5 flex gap-5">
                  <div className="relative w-24 h-24 bg-gray-100 rounded">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover rounded"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{item.name}</h3>
                    <div className="text-primary font-bold text-lg mb-4">{formatPrice(item.price)}</div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Устгах
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 h-fit sticky top-24">
              <h3 className="text-xl font-bold mb-6">Захиалгын хураангуй</h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span>Бүтээгдэхүүний үнэ:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Хүргэлт:</span>
                  <span>{shippingCost === 0 ? 'Үнэгүй' : formatPrice(shippingCost)}</span>
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between text-xl font-bold">
                  <span>Нийт:</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>
              {subtotal < 60000 && (
                <div className="bg-green-50 text-green-700 p-3 rounded mb-4 text-sm">
                  <span>{formatPrice(60000 - subtotal)} нэмж захиалбал үнэгүй хүргэлт!</span>
                </div>
              )}
              <button
                onClick={() => router.push('/checkout')}
                className="w-full bg-primary text-white py-4 rounded font-bold hover:bg-secondary transition mb-4"
              >
                Захиалга хийх
              </button>
              <Link href="/products" className="block text-center text-primary hover:underline">
                Худалдаа үргэлжлүүлэх
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
