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

  const categoryLink = (slug: string | null, label: string) => {
    const isActive = (slug === null && !params.category) || params.category === slug
    const href = slug ? `/products?category=${slug}` : '/products'
    return (
      <Link
        href={href}
        className={`block py-2 px-3 rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          isActive ? 'bg-primary/10 text-primary font-medium' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="container py-8 flex flex-col md:flex-row gap-8">
        <aside className="md:w-52 shrink-0">
          <div className="card p-4">
            <h3 className="font-medium text-stone-900 mb-3 text-sm uppercase tracking-widest text-stone-500">Ангилал</h3>
            <nav className="space-y-0.5">
              {categoryLink(null, 'Бүгд')}
              {categories.map((c) => categoryLink(c.slug, c.name))}
            </nav>
          </div>
        </aside>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-stone-900">Бүтээгдэхүүн</h1>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {(products ?? []).map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="card overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <div className="aspect-square overflow-hidden bg-stone-50">
                  <Image
                    src={p.image}
                    alt={p.name}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </div>
                <div className="p-5 space-y-1">
                  <p className="font-medium line-clamp-2 text-stone-900 text-sm md:text-base">{p.name}</p>
                  <p className="font-semibold text-stone-900" style={{ color: 'var(--primary)' }}>{formatPrice(p.price)}</p>
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
