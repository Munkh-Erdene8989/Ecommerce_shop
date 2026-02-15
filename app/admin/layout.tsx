'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/providers/AuthProvider'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/admin', label: 'Хянах самбар' },
  { href: '/admin/products', label: 'Бүтээгдэхүүн' },
  { href: '/admin/orders', label: 'Захиалга' },
  { href: '/admin/customers', label: 'Хэрэглэгчид' },
  { href: '/admin/inventory', label: 'Нөөц' },
  { href: '/admin/promotions/coupons', label: 'Купон' },
  { href: '/admin/marketing', label: 'Маркетинг' },
  { href: '/admin/settings', label: 'Тохиргоо' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, session, loading } = useAuth()
  const [role, setRole] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!session?.access_token) {
      setChecking(false)
      return
    }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => r.json())
      .then((data) => setRole(data?.role ?? null))
      .catch(() => setRole(null))
      .finally(() => setChecking(false))
  }, [session?.access_token])

  useEffect(() => {
    if (checking || loading) return
    if (!user) {
      router.push('/login?next=' + encodeURIComponent(pathname ?? '/admin'))
      return
    }
    if (role !== 'admin' && role !== 'owner') {
      router.push('/')
    }
  }, [user, role, checking, loading, router, pathname])

  if (loading || checking || !user || (role !== 'admin' && role !== 'owner')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-white shadow min-h-screen sticky top-0">
        <div className="p-4 border-b">
          <Link href="/admin" className="text-xl font-bold text-primary">
            AZ BEAUTY
          </Link>
          <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Admin</span>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                pathname === item.href ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Link href="/" className="text-sm text-gray-600 hover:text-primary">
            Сайт руу →
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  )
}
