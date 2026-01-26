import Header from '@/components/Header'
import Footer from '@/components/Footer'
import HeroBanner from '@/components/HeroBanner'
import PromoBanner from '@/components/PromoBanner'
import CategoriesSection from '@/components/CategoriesSection'
import FeaturedProducts from '@/components/FeaturedProducts'
import { getProducts } from '@/lib/products'

export default async function Home() {
  const products = getProducts()
  
  return (
    <main>
      <Header />
      <HeroBanner />
      <PromoBanner />
      <CategoriesSection />
      <FeaturedProducts products={products} />
      <Footer />
    </main>
  )
}
