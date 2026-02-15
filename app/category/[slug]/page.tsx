import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { getCategoryName } from '@/lib/utils'
import { notFound } from 'next/navigation'

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price, original_price, image')
    .eq('category', slug)
    .order('created_at', { ascending: false })

  const name = getCategoryName(slug)

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">{name}</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(products ?? []).map((p) => (
            <Link key={p.id} href={`/products/${p.slug}`} className="border rounded-lg overflow-hidden hover:shadow-md transition">
              <Image src={p.image} alt={p.name} width={400} height={400} className="w-full aspect-square object-cover" />
              <div className="p-3">
                <p className="font-medium line-clamp-2">{p.name}</p>
                <p className="text-primary font-semibold">{formatPrice(p.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  )
}
