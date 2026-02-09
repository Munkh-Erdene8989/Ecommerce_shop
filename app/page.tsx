import Header from '@/components/Header'
import Footer from '@/components/Footer'
import HeroBanner from '@/components/HeroBanner'
import PromoBanner from '@/components/PromoBanner'
import CategoriesSection from '@/components/CategoriesSection'
import FeaturedProducts from '@/components/FeaturedProducts'

export default function Home() {
  return (
    <main>
      <Header />
      <HeroBanner />
      <PromoBanner />
      <CategoriesSection />
      <FeaturedProducts />
      <Footer />
    </main>
  )
}
