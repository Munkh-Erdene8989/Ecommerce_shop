'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { useProducts } from '@/lib/hooks/use-products'
import { getCategoryName } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function ProductsContent() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category') || undefined
  const sort = searchParams.get('sort') || undefined
  const skinType = searchParams.get('skin') || undefined
  const search = searchParams.get('search') || undefined

  const { data: products, isLoading } = useProducts({ category, sort, skinType, search })

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
          <Link href="/" className="text-gray-600 hover:text-primary">
            Нүүр
          </Link>{' '}
          / <span>{search ? `"${search}" хайлт` : getCategoryName(category || null)}</span>
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
                  {[
                    { value: 'skincare', label: 'Гоо сайхан' },
                    { value: 'makeup', label: 'Нүүрний будаг' },
                    { value: 'hair', label: 'Үсний бүтээгдэхүүн' },
                    { value: 'masks', label: 'Маск' },
                    { value: 'suncare', label: 'Нарнаас хамгаалах' },
                    { value: 'body', label: 'Биеийн арчилгаа' },
                  ].map((cat) => (
                    <Link
                      key={cat.value}
                      href={`/products?category=${cat.value}`}
                      className={`block py-1 hover:text-primary transition ${
                        category === cat.value ? 'text-primary font-medium' : ''
                      }`}
                    >
                      {cat.label}
                    </Link>
                  ))}
                  <Link href="/products" className="block py-1 text-primary hover:underline mt-2">
                    Бүгдийг харах
                  </Link>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-sm">Арьсны төрөл</h4>
                <div className="space-y-2 text-sm">
                  {[
                    { value: 'normal', label: 'Хэвийн' },
                    { value: 'oily', label: 'Тослог' },
                    { value: 'dry', label: 'Хуурай' },
                    { value: 'sensitive', label: 'Мэдрэмтгий' },
                  ].map((skin) => (
                    <Link
                      key={skin.value}
                      href={`/products?skin=${skin.value}`}
                      className={`block py-1 hover:text-primary transition ${
                        skinType === skin.value ? 'text-primary font-medium' : ''
                      }`}
                    >
                      {skin.label}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>

            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {search ? `"${search}" хайлтын үр дүн` : getCategoryName(category || null)}
                </h2>
                <div className="flex items-center gap-3">
                  <label className="text-sm">Эрэмбэлэх:</label>
                  <select
                    value={sort || 'default'}
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

              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded-lg h-80 animate-pulse" />
                  ))}
                </div>
              ) : !products || products.length === 0 ? (
                <div className="text-center py-20">
                  <h3 className="text-xl font-semibold mb-2">Бүтээгдэхүүн олдсонгүй</h3>
                  <p className="text-gray-600">Таны шүүлтэд тохирох бүтээгдэхүүн байхгүй байна.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-20">Ачааллаж байна...</div>
      }
    >
      <ProductsContent />
    </Suspense>
  )
}
