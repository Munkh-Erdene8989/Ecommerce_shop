'use client'

import Link from 'next/link'
import ProductCard from './ProductCard'
import { useFeaturedProducts, useNewProducts, useBestsellerProducts } from '@/lib/hooks/use-products'

function ProductSection({
  title,
  linkHref,
  products,
  isLoading,
  bgClass = '',
}: {
  title: string
  linkHref: string
  products: ReturnType<typeof useFeaturedProducts>['data']
  isLoading: boolean
  bgClass?: string
}) {
  return (
    <section className={`py-16 ${bgClass}`}>
      <div className="container mx-auto px-5">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">{title}</h2>
          <Link
            href={linkHref}
            className="text-primary font-medium flex items-center gap-2 hover:underline"
          >
            Бүгдийг харах
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-80 animate-pulse" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-10">Бүтээгдэхүүн байхгүй</p>
        )}
      </div>
    </section>
  )
}

export default function FeaturedProducts() {
  const { data: featured, isLoading: featuredLoading } = useFeaturedProducts()
  const { data: newProducts, isLoading: newLoading } = useNewProducts()
  const { data: bestsellers, isLoading: bestLoading } = useBestsellerProducts()

  return (
    <>
      <ProductSection
        title="Онцлох бүтээгдэхүүн"
        linkHref="/products"
        products={featured}
        isLoading={featuredLoading}
        bgClass="bg-gray-50"
      />
      <ProductSection
        title="Шинэ бүтээгдэхүүн"
        linkHref="/products?sort=new"
        products={newProducts}
        isLoading={newLoading}
      />
      <ProductSection
        title="Хамгийн их борлогдсон"
        linkHref="/products?sort=popular"
        products={bestsellers}
        isLoading={bestLoading}
        bgClass="bg-gray-50"
      />
    </>
  )
}
