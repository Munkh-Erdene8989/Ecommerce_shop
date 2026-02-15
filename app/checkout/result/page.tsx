import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function CheckoutResultPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Захиалгын төлөв</h1>
        <p className="text-gray-600 mb-6">Энэ хуудас нь төлбөрийн дараах үр дүнг харуулна.</p>
        <Link href="/account/orders" className="text-primary font-medium hover:underline">
          Захиалга харах →
        </Link>
      </div>
      <Footer />
    </main>
  )
}
