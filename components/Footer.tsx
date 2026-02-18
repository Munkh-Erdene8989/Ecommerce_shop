import Link from 'next/link'

const footerLink =
  'text-stone-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 rounded transition-colors duration-200 text-sm'

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 py-14 mt-auto">
      <div className="container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link
            href="/"
            className="text-lg font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 rounded transition-opacity"
          >
            AZ Beauty
          </Link>
          <p className="text-sm mt-3 text-stone-400 max-w-xs">
            Солонгос гоо сайхны шилдэг бүтээгдэхүүн
          </p>
        </div>
        <div>
          <h3 className="font-medium text-white text-sm uppercase tracking-widest mb-4">Холбоосууд</h3>
          <ul className="space-y-3">
            <li><Link href="/products" className={footerLink}>Бүтээгдэхүүн</Link></li>
            <li><Link href="/cart" className={footerLink}>Сагс</Link></li>
            <li><Link href="/login" className={footerLink}>Нэвтрэх</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-white text-sm uppercase tracking-widest mb-4">Тусламж</h3>
          <ul className="space-y-3">
            <li><Link href="/account/orders" className={footerLink}>Захиалга харах</Link></li>
            <li><Link href="/privacy-policy" className={footerLink}>Нууцлалын бодлого</Link></li>
            <li><Link href="/userterms" className={footerLink}>Үйлчилгээний нөхцөл</Link></li>
          </ul>
        </div>
      </div>
      <div className="container mt-12 pt-8 border-t border-stone-800">
        <p className="text-sm text-stone-500">© {new Date().getFullYear()} AZ Beauty. Бүх эрх хуулиар хамгаалагдсан.</p>
      </div>
    </footer>
  )
}
