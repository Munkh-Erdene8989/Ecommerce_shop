'use client'

import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/lib/providers/AuthProvider'
import { useRouter } from 'next/navigation'

export default function Header() {
  const { getItemCount } = useCart()
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  return (
    <header className="bg-white shadow sticky top-0 z-50">
      <div className="container flex items-center justify-between h-14">
        <Link href="/" className="text-xl font-bold text-primary">
          AZ BEAUTY
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/products" className="text-gray-700 hover:text-primary">
            Бүтээгдэхүүн
          </Link>
          <Link href="/cart" className="text-gray-700 hover:text-primary flex items-center gap-1">
            Сагс ({getItemCount()})
          </Link>
          {!loading && (
            user ? (
              <>
                <Link href="/account/orders" className="text-gray-700 hover:text-primary">
                  Захиалга
                </Link>
                {user.email?.includes('@') && (
                  <Link href="/admin" className="text-gray-500 text-sm">
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => signOut().then(() => router.push('/'))}
                  className="text-gray-600 hover:text-primary"
                >
                  Гарах
                </button>
              </>
            ) : (
              <Link href="/login" className="text-primary font-medium">
                Нэвтрэх
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  )
}
