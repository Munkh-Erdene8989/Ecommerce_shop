import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-auto">
      <div className="container flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <Link href="/" className="text-xl font-bold text-white">
            AZ BEAUTY
          </Link>
          <p className="text-sm mt-2">Солонгос гоо сайхны бүтээгдэхүүн</p>
        </div>
        <div className="flex gap-6">
          <Link href="/products" className="hover:text-white">
            Бүтээгдэхүүн
          </Link>
          <Link href="/cart" className="hover:text-white">
            Сагс
          </Link>
          <Link href="/login" className="hover:text-white">
            Нэвтрэх
          </Link>
        </div>
      </div>
      <p className="container mt-6 text-sm text-gray-500">© {new Date().getFullYear()} AZ Beauty</p>
    </footer>
  )
}
