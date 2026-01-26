import Link from 'next/link'

const categories = [
  { name: 'Гоо сайхан', icon: '💆', href: '/products?category=skincare' },
  { name: 'Нүүрний будаг', icon: '💄', href: '/products?category=makeup' },
  { name: 'Үсний бүтээгдэхүүн', icon: '✂️', href: '/products?category=hair' },
  { name: 'Маск', icon: '🎭', href: '/products?category=masks' },
  { name: 'Нарнаас хамгаалах', icon: '☀️', href: '/products?category=suncare' },
  { name: 'Биеийн арчилгаа', icon: '🧴', href: '/products?category=body' },
]

export default function CategoriesSection() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-5">
        <h2 className="text-3xl font-bold text-center mb-10">Ангилалууд</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="text-center p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition"
            >
              <div className="text-4xl mb-3">{category.icon}</div>
              <h3 className="font-medium">{category.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
