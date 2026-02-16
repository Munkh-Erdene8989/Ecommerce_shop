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
      {/* Hero — Exciner-style minimal */}
      <section className="border-b border-stone-200/60 bg-white">
        <div className="container py-16 md:py-24 text-center">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-stone-900 mb-4">
            AZ Beauty
          </h1>
          <p className="text-stone-500 text-lg max-w-md mx-auto mb-8">
            Солонгос гоо сайхны шилдэг бүтээгдэхүүн
          </p>
          <Link href="/products" className="btn-primary inline-flex">
            Бүтээгдэхүүн үзэх
          </Link>
        </div>
      </section>
      {/* Featured products */}
      <section className="container py-12 md:py-16">
        <h2 className="text-sm font-medium uppercase tracking-widest text-stone-400 mb-2">
          Онцлон санал болгох
        </h2>
        <p className="text-2xl md:text-3xl font-semibold text-stone-900 mb-8">
          Шилдэг бүтээгдэхүүн
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {(products ?? []).map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className="card overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="relative aspect-square overflow-hidden bg-stone-50">
                <Image
                  src={p.image}
                  alt={p.name}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />
                {p.original_price != null && p.original_price > p.price && (
                  <span
                    className="absolute top-3 left-3 rounded-full bg-primary text-white text-xs font-medium px-2.5 py-1"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    −{Math.round((1 - p.price / p.original_price) * 100)}%
                  </span>
                )}
              </div>
              <div className="p-5 space-y-1">
                <p className="font-medium line-clamp-2 text-stone-900 text-sm md:text-base">{p.name}</p>
                <p className="font-semibold text-stone-900" style={{ color: 'var(--primary)' }}>
                  {formatPrice(p.price)}
                </p>
                {p.original_price != null && p.original_price > p.price && (
                  <p className="text-sm text-stone-400 line-through">{formatPrice(p.original_price)}</p>
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
