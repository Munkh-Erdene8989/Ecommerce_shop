import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { getCategoryName } from '@/lib/utils'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  let q = supabase.from('products').select('id, name, slug, price, original_price, image, category')
  if (params.category) q = q.eq('category', params.category)
  if (params.search) q = q.ilike('name', `%${params.search}%`)
  q = q.order('created_at', { ascending: false })
  const { data: products } = await q

  const categories = [
    { slug: 'skincare', name: getCategoryName('skincare') },
    { slug: 'makeup', name: getCategoryName('makeup') },
    { slug: 'hair', name: getCategoryName('hair') },
    { slug: 'masks', name: getCategoryName('masks') },
  ]

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="container py-8 flex gap-8">
        <aside className="w-48 shrink-0">
          <h3 className="font-semibold mb-2">Ангилал</h3>
          <ul className="space-y-1">
            <li>
              <Link href="/products" className={!params.category ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}>
                Бүгд
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/products?category=${c.slug}`}
                  className={params.category === c.slug ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-6">Бүтээгдэхүүн</h1>
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
      </div>
      <Footer />
    </main>
  )
}
