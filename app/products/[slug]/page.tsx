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
      <div className="container py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Image src={product.image} alt={product.name} width={600} height={600} className="w-full aspect-square object-cover rounded-lg" />
          <div>
            <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
            <p className="text-primary text-xl font-semibold mb-4">{formatPrice(product.price)}</p>
            {product.original_price && product.original_price > product.price && (
              <p className="text-gray-500 line-through mb-2">{formatPrice(product.original_price)}</p>
            )}
            <p className="text-gray-600 mb-6">{product.description}</p>
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
