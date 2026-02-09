'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/lib/supabase/database.types'
import { formatPrice, renderStars, getDiscountPercent } from '@/lib/utils'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const discount = getDiscountPercent(product.price, product.original_price)

  return (
    <Link href={`/products/${product.id}`} className="block">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition">
        <div className="relative w-full h-64 bg-gray-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            unoptimized
          />
          {product.is_new && (
            <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
              Шинэ
            </span>
          )}
          {discount > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              -{discount}%
            </span>
          )}
        </div>
        <div className="p-4">
          <div className="text-xs text-gray-500 mb-1">{product.brand}</div>
          <h3 className="font-medium mb-2 line-clamp-2 h-10">{product.name}</h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold text-primary">{formatPrice(product.price)}</span>
            {product.original_price && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <span className="text-yellow-400">{renderStars(product.rating)}</span>
            <span>{product.rating}</span>
            <span className="text-gray-400">({product.reviews_count})</span>
          </div>
          {!product.in_stock && (
            <div className="mt-2 text-xs text-red-500 font-medium">Дууссан</div>
          )}
        </div>
      </div>
    </Link>
  )
}
