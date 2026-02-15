'use client'

import { useCart } from '@/contexts/CartContext'
import { useRouter } from 'next/navigation'
import type { Product } from '@/lib/shared'

export default function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const router = useRouter()

  const handleAdd = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      slug: product.slug,
    })
    router.push('/cart')
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={!product.in_stock}
      className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {product.in_stock ? 'Сагсанд нэмэх' : 'Дууссан'}
    </button>
  )
}
