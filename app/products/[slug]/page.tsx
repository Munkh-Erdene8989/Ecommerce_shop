import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import AddToCartButton from './AddToCartButton'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: product, error } = await supabase.from('products').select('*').eq('slug', slug).single()
  if (error || !product) notFound()

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="container py-10 md:py-14">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          <div className="card overflow-hidden aspect-square max-h-[480px] md:max-h-none bg-stone-50">
            <Image src={product.image} alt={product.name} width={600} height={600} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-semibold tracking-tight mb-4 text-stone-900">{product.name}</h1>
            <p className="text-xl font-semibold mb-2" style={{ color: 'var(--primary)' }}>{formatPrice(product.price)}</p>
            {product.original_price != null && product.original_price > product.price && (
              <p className="text-stone-400 line-through mb-4">{formatPrice(product.original_price)}</p>
            )}
            <p className="text-stone-600 mb-8 leading-relaxed">{product.description}</p>
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
