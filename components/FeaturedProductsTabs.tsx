 'use client'

import Link from 'next/link'
import ProductImage from '@/components/ProductImage'
import { formatPrice, getCategoryName } from '@/lib/utils'
import { useMemo, useState } from 'react'

type FeaturedProduct = {
  id: string
  name: string
  slug: string
  price: number
  original_price?: number | null
  image: string | null
  category: string | null
}

const CATEGORIES: { slug: string | null; label: string }[] = [
  { slug: null, label: 'All Products' },
  { slug: 'skincare', label: getCategoryName('skincare') },
  { slug: 'makeup', label: getCategoryName('makeup') },
  { slug: 'hair', label: getCategoryName('hair') },
  { slug: 'masks', label: getCategoryName('masks') },
]

export function FeaturedProductsTabs({ products }: { products: FeaturedProduct[] }) {
  const [currentCategory, setCurrentCategory] = useState<string | null>(null)

  const filteredProducts = useMemo(
    () => (currentCategory ? products.filter((p) => p.category === currentCategory) : products),
    [products, currentCategory],
  )

  return (
    <>
      <nav className="mb-8 flex flex-wrap gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(({ slug, label }) => {
          const isActive = (slug === null && !currentCategory) || currentCategory === slug
          return (
            <button
              key={label}
              type="button"
              onClick={() => setCurrentCategory(slug)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                isActive
                  ? 'border-pink-500 bg-pink-500 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-pink-400 hover:bg-pink-50 hover:text-pink-600 hover:-translate-y-0.5 hover:shadow-sm'
              }`}
            >
              {label}
            </button>
          )
        })}
      </nav>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {filteredProducts.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.slug}`}
            className="card overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <div className="relative aspect-square overflow-hidden bg-stone-50">
              <ProductImage
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
    </>
  )
}

