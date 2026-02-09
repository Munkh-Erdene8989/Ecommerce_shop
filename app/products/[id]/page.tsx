'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { useProduct, useProducts } from '@/lib/hooks/use-products'
import { formatPrice, getDiscountPercent } from '@/lib/utils'
import { useCart } from '@/contexts/CartContext'
import Image from 'next/image'
import Link from 'next/link'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')

  const productId = params.id as string
  const { data: product, isLoading, error } = useProduct(productId)
  const { data: allProducts } = useProducts({ category: product?.category })

  const relatedProducts = allProducts?.filter((p) => p.id !== productId).slice(0, 4) || []

  if (isLoading) {
    return (
      <main>
        <Header />
        <div className="container mx-auto px-5 py-20">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="bg-gray-200 h-96 rounded-lg animate-pulse" />
            <div className="space-y-4">
              <div className="bg-gray-200 h-8 rounded animate-pulse w-3/4" />
              <div className="bg-gray-200 h-6 rounded animate-pulse w-1/2" />
              <div className="bg-gray-200 h-10 rounded animate-pulse w-1/3" />
              <div className="bg-gray-200 h-20 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (error || !product) {
    return (
      <main>
        <Header />
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Бүтээгдэхүүн олдсонгүй</h2>
          <Link href="/products" className="text-primary hover:underline">
            Бүтээгдэхүүн руу буцах
          </Link>
        </div>
        <Footer />
      </main>
    )
  }

  const discount = getDiscountPercent(product.price, product.original_price)

  const handleAddToCart = () => {
    addToCart(
      {
        id: parseInt(product.id) || 0,
        name: product.name,
        price: product.price,
        image: product.image,
      },
      quantity
    )
    alert('Сагсанд нэмэгдлээ!')
  }

  const handleBuyNow = () => {
    addToCart(
      {
        id: parseInt(product.id) || 0,
        name: product.name,
        price: product.price,
        image: product.image,
      },
      quantity
    )
    router.push('/checkout')
  }

  return (
    <main>
      <Header />
      <div className="bg-gray-100 py-3">
        <div className="container mx-auto px-5">
          <Link href="/" className="text-gray-600 hover:text-primary">
            Нүүр
          </Link>{' '}
          /{' '}
          <Link href="/products" className="text-gray-600 hover:text-primary">
            Бүтээгдэхүүн
          </Link>{' '}
          / <span>{product.name}</span>
        </div>
      </div>

      <section className="py-10">
        <div className="container mx-auto px-5">
          <div className="grid md:grid-cols-2 gap-10 mb-16">
            <div>
              <div className="relative w-full h-96 bg-gray-100 rounded-lg mb-4">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover rounded-lg"
                  unoptimized
                />
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-2">{product.brand}</div>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-yellow-400">★★★★★</span>
                <span>{product.rating}</span>
                <span className="text-gray-500">({product.reviews_count} үнэлгээ)</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                {product.original_price && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(product.original_price)}
                    </span>
                    {discount > 0 && (
                      <span className="bg-red-500 text-white px-3 py-1 rounded">
                        -{discount}%
                      </span>
                    )}
                  </>
                )}
              </div>

              <p className="text-gray-600 mb-8 leading-relaxed">{product.description}</p>

              {product.skin_type && product.skin_type.length > 0 && (
                <div className="mb-4">
                  <span className="text-sm font-semibold">Арьсны төрөл: </span>
                  <div className="flex gap-2 mt-1">
                    {product.skin_type.map((type) => (
                      <span
                        key={type}
                        className="text-xs bg-gray-100 px-2 py-1 rounded"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block mb-2 font-semibold">Тоо ширхэг:</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-gray-300 rounded flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center border border-gray-300 rounded py-2"
                    min="1"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border border-gray-300 rounded flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-4 mb-8">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.in_stock}
                  className="flex-1 bg-primary text-white py-4 rounded font-bold hover:bg-secondary transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {product.in_stock ? 'Сагсанд нэмэх' : 'Дууссан'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={!product.in_stock}
                  className="flex-1 bg-gray-900 text-white py-4 rounded font-bold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Одоо худалдаж авах
                </button>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>60,000₮ дээш үнэгүй хүргэлт</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Баталгаатай чанар</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>30 хоногийн буцаах эрх</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-16">
            <div className="flex gap-6 border-b border-gray-200 mb-6">
              {[
                { id: 'description', label: 'Тайлбар' },
                { id: 'ingredients', label: 'Найрлага' },
                { id: 'reviews', label: 'Үнэлгээ' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 px-2 font-semibold ${
                    activeTab === tab.id
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div>
              {activeTab === 'description' && (
                <div>
                  <p className="text-gray-600 leading-relaxed mb-4">{product.description}</p>
                  <p className="text-gray-600 leading-relaxed">
                    Энэ бүтээгдэхүүн нь солонгосын шилдэг гоо сайхны брэндүүдийн нэг юм. Байгалийн
                    найрлагатай, арьсанд ээлтэй.
                  </p>
                </div>
              )}
              {activeTab === 'ingredients' && (
                <p className="text-gray-600 leading-relaxed">
                  Найрлага: Ус, Глицерин, Хиалуроны хүчил, Ниацинамид, Пантенол, Токоферол, Аллантоин
                </p>
              )}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <strong>Сараа</strong>
                      <span className="text-yellow-400">★★★★★</span>
                    </div>
                    <p className="text-gray-600">Маш сайн бүтээгдэхүүн! Арьс маань илүү гэрэлтэй болсон.</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <strong>Болд</strong>
                      <span className="text-yellow-400">★★★★☆</span>
                    </div>
                    <p className="text-gray-600">Чанартай, үнэ хямд. Дахиж захиалах болно.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Холбоотой бүтээгдэхүүн</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
