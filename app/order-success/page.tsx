'use client'

import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  return (
    <main>
      <Header />
      <section className="py-20 min-h-[60vh] flex items-center">
        <div className="container mx-auto px-5">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-6xl text-green-500 mb-6">✓</div>
            <h1 className="text-4xl font-bold mb-4">Захиалга амжилттай хийгдлээ!</h1>
            <p className="text-lg text-gray-600 mb-8">
              Таны захиалга хүлээн авлаа. Бид удахгүй танд холбогдох болно.
            </p>
            {orderId && (
              <div className="bg-gray-100 p-6 rounded-lg mb-8 text-left">
                <p className="mb-2"><strong>Захиалгын дугаар:</strong> #{orderId}</p>
                <p><strong>Огноо:</strong> {new Date().toLocaleDateString('mn-MN')}</p>
              </div>
            )}
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/"
                className="bg-primary text-white px-10 py-4 rounded-full font-bold hover:shadow-lg transition"
              >
                Нүүр хуудас руу буцах
              </Link>
              <Link
                href="/products"
                className="bg-white text-primary border-2 border-primary px-10 py-4 rounded-full font-bold hover:bg-gray-50 transition"
              >
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
