'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { getProductById, getProducts, formatPrice, Product } from '@/lib/products'
import { useCart } from '@/contexts/CartContext'
import Image from 'next/image'
import Link from 'next/link'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addToCart } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')

  useEffect(() => {
    const id = parseInt(params.id as string)
    const foundProduct = getProductById(id)
    if (!foundProduct) {
      router.push('/products')
      return
    }
    setProduct(foundProduct)
  }, [params.id, router])

  if (!product) {
    return <div className="text-center py-20">Ачааллаж байна...</div>
  }

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0

  const relatedProducts = getProducts()
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    }, quantity)
    alert('Сагсанд нэмэгдлээ!')
  }

  const handleBuyNow = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    }, quantity)
    router.push('/checkout')
  }

  return (
    <main>
      <Header />
      <div className="bg-gray-100 py-3">
        <div className="container mx-auto px-5">
          <Link href="/" className="text-gray-600 hover:text-primary">Нүүр</Link> /{' '}
          <Link href="/products" className="text-gray-600 hover:text-primary">Бүтээгдэхүүн</Link> /{' '}
          <span>{product.name}</span>
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
                />
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-yellow-400">★★★★★</span>
                <span>{product.rating}</span>
                <span className="text-gray-500">({product.reviews} үнэлгээ)</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(product.originalPrice)}
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
                  className="flex-1 bg-primary text-white py-4 rounded font-bold hover:bg-secondary transition"
                >
                  Сагсанд нэмэх
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 bg-gray-900 text-white py-4 rounded font-bold hover:bg-gray-800 transition"
                >
                  Одоо худалдаж авах
                </button>
                <button className="w-14 h-14 border border-gray-300 rounded flex items-center justify-center hover:border-primary transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
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

          <div className="mb-16">
            <div className="flex gap-6 border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('description')}
                className={`pb-4 px-2 font-semibold ${
                  activeTab === 'description'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-600'
                }`}
              >
                Тайлбар
              </button>
              <button
                onClick={() => setActiveTab('ingredients')}
                className={`pb-4 px-2 font-semibold ${
                  activeTab === 'ingredients'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-600'
                }`}
              >
                Найрлага
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-4 px-2 font-semibold ${
                  activeTab === 'reviews'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-600'
                }`}
              >
                Үнэлгээ
              </button>
            </div>

            <div>
              {activeTab === 'description' && (
                <div>
                  <p className="text-gray-600 leading-relaxed mb-4">{product.description}</p>
                  <p className="text-gray-600 leading-relaxed">
                    Энэ бүтээгдэхүүн нь солонгосын шилдэг гоо сайхны брэндүүдийн нэг юм. Байгалийн найрлагатай, арьсанд ээлтэй.
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
