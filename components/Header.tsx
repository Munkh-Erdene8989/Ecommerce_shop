'use client'

import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/lib/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Header() {
  const { getItemCount } = useCart()
  const { user, session, loading, signOut } = useAuth()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const count = getItemCount()
  const navLink =
    'text-stone-600 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200'

  const displayName =
    (user?.user_metadata?.full_name ??
      user?.user_metadata?.name ??
      user?.email ??
      '') as string

  const initial =
    displayName?.toString().charAt(0).toUpperCase() || '?'

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
          {!loading && user && (
            <div className="relative ml-1">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-stone-200 px-3 py-1.5 text-xs sm:text-sm text-stone-700 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {initial}
                </span>
                <span className="hidden sm:inline max-w-[160px] truncate">
                  {displayName}
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-lg border border-stone-200 bg-white shadow-lg py-1 text-sm z-50">
                  <Link
                    href="/account/orders"
                    className="block px-3 py-2 text-stone-700 hover:bg-stone-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Захиалга
                  </Link>
                  <Link
                    href="/account/profile"
                    className="block px-3 py-2 text-stone-700 hover:bg-stone-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Профайл
                  </Link>
                  {user.email?.includes('@') && (
                    <Link
                      href="/admin"
                      className="block px-3 py-2 text-stone-500 hover:bg-stone-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      signOut().then(() => {
                        setMenuOpen(false)
                        router.push('/')
                      })
                    }
                    className="block w-full text-left px-3 py-2 text-stone-500 hover:bg-stone-50"
                  >
                    Гарах
                  </button>
                </div>
              )}
            </div>
          )}
          {!loading && !user && (
            <Link
              href="/login"
              className="text-primary font-medium hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full px-4 py-2 text-sm transition-colors"
              style={{ color: 'var(--primary)' }}
            >
              Нэвтрэх
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
