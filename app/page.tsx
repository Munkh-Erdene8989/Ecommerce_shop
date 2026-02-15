import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'

export default async function Home() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price, original_price, image, is_featured')
    .eq('is_featured', true)
    .limit(8)

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <section className="container py-12">
        <div className="rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 p-8 mb-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AZ Beauty</h1>
          <p className="text-gray-600">Солонгос гоо сайхны шилдэг бүтээгдэхүүн</p>
          <Link
            href="/products"
            className="inline-block mt-4 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark"
          >
            Дэлгэрэнгүй
          </Link>
        </div>
        <h2 className="text-2xl font-bold mb-6">Онцлон санал болгох</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(products ?? []).map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className="border rounded-lg overflow-hidden hover:shadow-md transition"
            >
              <Image src={p.image} alt={p.name} width={400} height={400} className="w-full aspect-square object-cover" />
              <div className="p-3">
                <p className="font-medium line-clamp-2">{p.name}</p>
                <p className="text-primary font-semibold">{formatPrice(p.price)}</p>
                {p.original_price && p.original_price > p.price && (
                  <p className="text-sm text-gray-500 line-through">{formatPrice(p.original_price)}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  )
}
