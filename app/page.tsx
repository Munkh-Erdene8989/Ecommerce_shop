import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { FeaturedProductsTabs } from '../components/FeaturedProductsTabs'

// LCP болон cache: нүүр хуудсыг 60 сек кэшлэнэ
export const revalidate = 60

const HERO_BLUR =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQACEQADAP'

export default async function Home() {
  const supabase = await createClient()
  const { data: storeSettingsRows } = await supabase
    .from('store_settings')
    .select('value')
    .eq('key', 'general')
  const storeSettingsValue = (storeSettingsRows?.[0]?.value as { hero_image_url?: string } | undefined) ?? {}
  const heroImageUrl = typeof storeSettingsValue.hero_image_url === 'string' ? storeSettingsValue.hero_image_url : ''

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price, original_price, image, is_featured, category')
    .eq('is_featured', true)
    .limit(8)

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      {/* Hero — K-Beauty style */}
      <section className="border-b border-stone-200/60 bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="container py-16 md:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full bg-white/70 px-4 py-1 text-xs font-medium text-pink-600 shadow-sm ring-1 ring-pink-100 backdrop-blur">
                ✨ New Collection 2026
              </span>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-stone-900 leading-tight">
              Гэрэлтсэн төгс {' '}
                <span className="bg-gradient-to-r from-pink-500 to-fuchsia-500 bg-clip-text text-transparent">
                арьсны нууцыг нээ
                </span>
              </h1>
              <p className="text-base md:text-lg max-w-xl text-stone-500">
                Гоо сайхны бүтээгдэхүүнүүд. Арьсыг тань гэрэлтсэн, эрүүл харагдуулах
                найрлагатай, өндөр чанарын шүтэлтүүд.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/products"
                  className="btn-primary inline-flex items-center justify-center px-6 py-3 text-sm md:text-base"
                >
                  Shop Now
                </Link>
                <Link
                  href="#featured"
                  className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-white/70 px-6 py-3 text-sm md:text-base font-medium text-stone-800 shadow-sm hover:border-stone-300 hover:bg-white"
                >
                  Learn More
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-8 text-sm md:text-base">
                <div>
                  <p className="text-2xl md:text-3xl font-semibold text-pink-500">500+</p>
                  <p className="text-stone-500">Products</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-semibold text-pink-500">50K+</p>
                  <p className="text-stone-500">Happy Customers</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-semibold text-pink-500">4.9★</p>
                  <p className="text-stone-500">Average Rating</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[32px] bg-gradient-to-br from-stone-100 via-stone-50 to-pink-100 shadow-xl">
                {heroImageUrl ? (
                  <Image
                    src={heroImageUrl}
                    alt="Hero"
                    fill
                    priority
                    placeholder="blur"
                    blurDataURL={HERO_BLUR}
                    sizes="(min-width: 1024px) 420px, 70vw"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(248,181,212,0.7),_transparent_55%)]" />
                )}
              </div>
              <div className="absolute -bottom-6 left-4 right-4">
                <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-50 text-xs font-semibold text-pink-500">
                    AZ
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-stone-900">Free Shipping</p>
                    <p className="text-xs text-stone-500">100,000₮-өөс дээш захиалгад</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Featured products */}
      <section id="featured" className="container py-12 md:py-16">
        <h2 className="text-sm font-medium uppercase tracking-widest text-stone-400 mb-2">
          Онцлон санал болгох
        </h2>
        <p className="text-2xl md:text-3xl font-semibold text-stone-900 mb-4 md:mb-6">
          Шилдэг бүтээгдэхүүн
        </p>
        <FeaturedProductsTabs products={products ?? []} />
      </section>
      <Footer />
    </main>
  )
}
