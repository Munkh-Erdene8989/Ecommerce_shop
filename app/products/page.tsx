'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { getProducts, Product } from '@/lib/products'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function ProductsContent() {
  const searchParams = useSearchParams()
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [sortBy, setSortBy] = useState('default')

  useEffect(() => {
    let products = getProducts()
    const category = searchParams.get('category')
    const sort = searchParams.get('sort')
    const skinType = searchParams.get('skin')

    if (category) {
      products = products.filter(p => p.category === category)
    }

    if (skinType) {
      products = products.filter(p => p.skinType && p.skinType.includes(skinType))
    }

    if (sort === 'price-low') {
      products.sort((a, b) => a.price - b.price)
    } else if (sort === 'price-high') {
      products.sort((a, b) => b.price - a.price)
    } else if (sort === 'new') {
      products = products.slice().reverse()
    } else if (sort === 'popular') {
      products.sort((a, b) => b.reviews - a.reviews)
    }

    setFilteredProducts(products)
    if (sort) setSortBy(sort)
  }, [searchParams])

  const getCategoryName = (category: string | null) => {
    const names: Record<string, string> = {
      'skincare': 'Гоо сайхан',
      'makeup': 'Нүүрний будаг',
      'hair': 'Үсний бүтээгдэхүүн',
      'masks': 'Маск',
      'suncare': 'Нарнаас хамгаалах',
      'body': 'Биеийн арчилгаа'
    }
    return names[category || ''] || 'Бүтээгдэхүүн'
  }

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'default') {
      params.delete('sort')
    } else {
      params.set('sort', value)
    }
    window.location.href = `/products?${params.toString()}`
  }

  return (
    <main>
      <Header />
      <div className="bg-gray-100 py-3">
        <div className="container mx-auto px-5">
          <Link href="/" className="text-gray-600 hover:text-primary">Нүүр</Link> / <span>{getCategoryName(searchParams.get('category'))}</span>
        </div>
      </div>

      <section className="py-10">
        <div className="container mx-auto px-5">
          <div className="flex flex-col md:flex-row gap-8">
            <aside className="w-full md:w-64 bg-white p-5 rounded-lg border border-gray-200 h-fit sticky top-24">
              <h3 className="text-lg font-semibold mb-5">Шүүлт</h3>
              
              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-sm">Ангилал</h4>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" />
                    <span>Гоо сайхан</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" />
                    <span>Нүүрний будаг</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" />
                    <span>Үсний бүтээгдэхүүн</span>
                  </label>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-sm">Үнэ</h4>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="price" className="w-4 h-4" />
                    <span>0₮ - 50,000₮</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="price" className="w-4 h-4" />
                    <span>50,000₮ - 100,000₮</span>
                  </label>
                </div>
              </div>
            </aside>

            <main className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{getCategoryName(searchParams.get('category'))}</h2>
                <div className="flex items-center gap-3">
                  <label className="text-sm">Эрэмбэлэх:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSort(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded"
                  >
                    <option value="default">Анхны байдал</option>
                    <option value="price-low">Үнэ: Багаас их рүү</option>
                    <option value="price-high">Үнэ: Ихээс бага руу</option>
                    <option value="new">Шинэ</option>
                    <option value="popular">Алдартай</option>
                  </select>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-20">
                  <h3 className="text-xl font-semibold mb-2">Бүтээгдэхүүн олдсонгүй</h3>
                  <p className="text-gray-600">Таны шүүлтэд тохирох бүтээгдэхүүн байхгүй байна.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Ачааллаж байна...</div>}>
      <ProductsContent />
    </Suspense>
  )
}
