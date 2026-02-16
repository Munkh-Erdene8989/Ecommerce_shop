'use client'

import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/lib/providers/AuthProvider'
import { useRouter } from 'next/navigation'

export default function Header() {
  const { getItemCount } = useCart()
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  const count = getItemCount()
  const navLink =
    'text-stone-600 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200'

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-stone-200/60 sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg transition-opacity hover:opacity-80"
        >
          AZ Beauty
        </Link>
        <nav className="flex items-center gap-0.5 md:gap-1">
          <Link href="/products" className={navLink}>
            Бүтээгдэхүүн
          </Link>
          <Link href="/cart" className={`${navLink} flex items-center gap-2`}>
            Сагс
            {count > 0 && (
              <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-primary text-white text-xs font-medium">
                {count}
              </span>
            )}
          </Link>
          {!loading && (
            user ? (
              <>
                <Link href="/account/orders" className={navLink}>
                  Захиалга
                </Link>
                {user.email?.includes('@') && (
                  <Link href="/admin" className="text-stone-400 text-sm hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full px-3 py-2 transition-colors">
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => signOut().then(() => router.push('/'))}
                  className="text-stone-500 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200"
                >
                  Гарах
                </button>
              </>
            ) : (
              <Link href="/login" className="text-primary font-medium hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full px-4 py-2 text-sm transition-colors" style={{ color: 'var(--primary)' }}>
                Нэвтрэх
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  )
}
