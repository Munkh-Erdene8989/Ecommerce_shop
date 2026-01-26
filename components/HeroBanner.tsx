import Link from 'next/link'

export default function HeroBanner() {
  return (
    <section className="bg-gradient-to-r from-primary to-secondary text-white py-20 text-center">
      <div className="container mx-auto px-5">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Солонгос гоо сайхны шилдэг бүтээгдэхүүн</h2>
        <p className="text-lg md:text-xl mb-8">Чанартай, байгалийн найрлагатай бүтээгдэхүүн</p>
        <Link href="/products" className="inline-block bg-white text-primary px-10 py-4 rounded-full font-bold hover:shadow-lg transition">
          Одоо худалдаж авах
        </Link>
      </div>
    </section>
  )
}
