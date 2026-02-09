'use client'

import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/lib/providers/AuthProvider'
import { useProfile } from '@/lib/hooks/use-auth'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Header() {
  const { getItemCount } = useCart()
  const { user, loading, signOut } = useAuth()
  const { data: profile } = useProfile()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const userMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setIsUserMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="bg-gray-100 py-2">
        <div className="container mx-auto px-5">
          <div className="flex justify-between items-center text-xs">
            <div className="flex gap-5">
              {!loading && !user ? (
                <Link href="/login" className="hover:text-primary transition">
                  Нэвтрэх / Бүртгүүлэх
                </Link>
              ) : (
                <span className="text-gray-600">
                  Сайн байна уу, {profile?.full_name || user?.email?.split('@')[0]}
                </span>
              )}
              {user && (
                <Link href="/orders" className="hover:text-primary transition">
                  Захиалга хянах
                </Link>
              )}
            </div>
            <div className="flex gap-3">
              <select className="px-2 py-1 border border-gray-300 rounded text-xs">
                <option value="mn">Монгол</option>
                <option value="en">English</option>
              </select>
              <select className="px-2 py-1 border border-gray-300 rounded text-xs">
                <option value="mnt">₮ MNT</option>
                <option value="usd">$ USD</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="py-4">
        <div className="container mx-auto px-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-3xl font-bold text-primary">
              AZ BEAUTY
            </Link>

            <nav className="hidden md:flex gap-8">
              <Link href="/" className="font-medium hover:text-primary transition">
                Нүүр
              </Link>
              <div className="relative group">
                <Link
                  href="/products?category=skincare"
                  className="font-medium hover:text-primary transition"
                >
                  Гоо сайхан
                </Link>
                <div className="absolute top-full left-0 mt-2 w-96 bg-white shadow-lg rounded p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-50">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <h4 className="font-semibold mb-2">Бүтээгдэхүүн</h4>
                      <Link
                        href="/products?category=skincare"
                        className="block py-1 text-sm text-gray-600 hover:text-primary"
                      >
                        Бүх гоо сайхны бүтээгдэхүүн
                      </Link>
                      <Link
                        href="/products?category=moisturizers"
                        className="block py-1 text-sm text-gray-600 hover:text-primary"
                      >
                        Чийгшүүлэгч
                      </Link>
                      <Link
                        href="/products?category=cleansers"
                        className="block py-1 text-sm text-gray-600 hover:text-primary"
                      >
                        Цэвэрлэгч
                      </Link>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Арьсны төрөл</h4>
                      <Link
                        href="/products?skin=normal"
                        className="block py-1 text-sm text-gray-600 hover:text-primary"
                      >
                        Хэвийн
                      </Link>
                      <Link
                        href="/products?skin=oily"
                        className="block py-1 text-sm text-gray-600 hover:text-primary"
                      >
                        Тослог
                      </Link>
                      <Link
                        href="/products?skin=dry"
                        className="block py-1 text-sm text-gray-600 hover:text-primary"
                      >
                        Хуурай
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <Link href="/products?category=makeup" className="font-medium hover:text-primary transition">
                Нүүрний будаг
              </Link>
              <Link href="/products?category=hair" className="font-medium hover:text-primary transition">
                Үсний бүтээгдэхүүн
              </Link>
              <Link href="/products?category=masks" className="font-medium hover:text-primary transition">
                Маск
              </Link>
              <Link href="/products?category=suncare" className="font-medium hover:text-primary transition">
                Нарнаас хамгаалах
              </Link>
            </nav>

            <div className="flex items-center gap-5">
              <form
                onSubmit={handleSearch}
                className="hidden md:flex items-center border border-gray-300 rounded-full px-4 py-2 bg-gray-50"
              >
                <input
                  type="text"
                  placeholder="Хайх..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none w-40 text-sm"
                />
                <button type="submit" className="text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </form>

              <Link href="/cart" className="relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                {getItemCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    {getItemCount()}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                  {user ? (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {profile?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || '👤'}
                    </div>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-200 py-2 z-50">
                    {user ? (
                      <>
                        <div className="px-4 py-2 border-b border-gray-100">
                          <div className="text-sm font-medium truncate">
                            {profile?.full_name || user.email}
                          </div>
                          <div className="text-xs text-gray-500 truncate">{user.email}</div>
                        </div>
                        <Link
                          href="/orders"
                          className="block px-4 py-2 text-sm hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Миний захиалгууд
                        </Link>
                        {profile?.role === 'admin' && (
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-sm hover:bg-gray-50 text-primary font-medium"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Админ хянах самбар
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Гарах
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="block px-4 py-2 text-sm hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Нэвтрэх
                        </Link>
                        <Link
                          href="/login"
                          className="block px-4 py-2 text-sm hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Бүртгүүлэх
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
              <nav className="space-y-3">
                <Link href="/" className="block text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
                  Нүүр
                </Link>
                <Link href="/products?category=skincare" className="block text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
                  Гоо сайхан
                </Link>
                <Link href="/products?category=makeup" className="block text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
                  Нүүрний будаг
                </Link>
                <Link href="/products?category=hair" className="block text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
                  Үсний бүтээгдэхүүн
                </Link>
                <Link href="/products?category=masks" className="block text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
                  Маск
                </Link>
                {user ? (
                  <>
                    <Link href="/orders" className="block text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
                      Миний захиалгууд
                    </Link>
                    {profile?.role === 'admin' && (
                      <Link href="/admin" className="block text-sm font-medium text-primary" onClick={() => setIsMenuOpen(false)}>
                        Админ хянах самбар
                      </Link>
                    )}
                    <button onClick={handleSignOut} className="block text-sm text-red-600">
                      Гарах
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="block text-sm font-medium text-primary" onClick={() => setIsMenuOpen(false)}>
                    Нэвтрэх / Бүртгүүлэх
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
