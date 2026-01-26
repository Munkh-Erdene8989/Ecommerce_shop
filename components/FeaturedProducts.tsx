import Link from 'next/link'
import ProductCard from './ProductCard'
import { Product } from '@/lib/products'

interface FeaturedProductsProps {
  products: Product[]
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  const featured = products.slice(0, 4)
  const newProducts = products.slice(4, 8)
  const bestSellers = products.slice(8, 12)

  return (
    <>
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-5">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Онцлох бүтээгдэхүүн</h2>
            <Link href="/products" className="text-primary font-medium flex items-center gap-2 hover:underline">
              Бүгдийг харах
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-5">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Шинэ бүтээгдэхүүн</h2>
            <Link href="/products?sort=new" className="text-primary font-medium flex items-center gap-2 hover:underline">
              Бүгдийг харах
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {newProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-5">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Хамгийн их борлогдсон</h2>
            <Link href="/products?sort=bestseller" className="text-primary font-medium flex items-center gap-2 hover:underline">
              Бүгдийг харах
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
