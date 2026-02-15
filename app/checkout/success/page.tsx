import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>
}) {
  const params = await searchParams
  const orderId = params.order_id ?? ''

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">Захиалга амжилттай!</h1>
        <p className="text-gray-600 mb-6">
          Таны захиалга хүлээн авлаа. {orderId && `Захиалга #${orderId.slice(0, 8)}`}
        </p>
        <Link
          href="/account/orders"
          className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark"
        >
          Захиалга харах
        </Link>
      </div>
      <Footer />
    </main>
  )
}
