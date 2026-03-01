'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/providers/AuthProvider'
import { useQuery } from '@apollo/client'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
  Tag,
  Settings,
  BarChart3,
  FileText,
  Megaphone,
  Image,
  Menu,
  X,
  PanelTop,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { STORE_SETTINGS } from '@/lib/admin/graphql'

const nav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Бүтээгдэхүүн', icon: Package },
  { href: '/admin/orders', label: 'Захиалга', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Хэрэглэгчид', icon: Users },
  { href: '/admin/inventory', label: 'Нөөц', icon: Warehouse },
  { href: '/admin/promotions/coupons', label: 'Купон', icon: Tag },
  { href: '/admin/marketing', label: 'Маркетинг', icon: Megaphone },
  { href: '/admin/homepage', label: 'Нүүр хуудас (Hero)', icon: Image },
  { href: '/admin/popup', label: 'Popup цонх', icon: PanelTop },
  { href: '/admin/audit', label: 'Audit log', icon: FileText },
  { href: '/admin/settings', label: 'Тохиргоо', icon: Settings },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { data } = useQuery(STORE_SETTINGS)
  const storeName: string = data?.storeSettings?.store_name ?? 'AZ Beauty'
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Desktop sidebar */}
      <aside className="hidden md:fixed md:left-0 md:top-0 md:z-40 md:flex md:h-screen md:w-56 md:flex-col md:border-r md:border-gray-200 md:bg-white">
        <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-4">
          <Link href="/admin" className="font-semibold text-primary">
            {storeName} Dashboard
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {nav.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col md:pl-56">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 md:hidden"
              aria-label="Toggle navigation"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              Дэлгүүр рүү
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="max-w-[120px] truncate text-sm text-gray-600 sm:max-w-none">{user?.email ?? '—'}</span>
            <Button variant="outline" size="sm" onClick={() => signOut()} className="shrink-0">
              Гарах
            </Button>
          </div>
        </header>
        {/* Mobile nav overlay — контентын дээр, зай үлдээхгүй */}
        <div
          className={cn(
            'fixed inset-0 z-30 md:hidden',
            mobileNavOpen ? 'pointer-events-auto' : 'pointer-events-none'
          )}
          aria-hidden={!mobileNavOpen}
        >
          <button
            type="button"
            className={cn(
              'absolute inset-0 bg-black/40 transition-opacity duration-200',
              mobileNavOpen ? 'opacity-100' : 'opacity-0'
            )}
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <div
            className={cn(
              'absolute left-0 right-0 top-14 z-10 max-h-[calc(100vh-3.5rem)] overflow-y-auto border-b border-gray-200 bg-white shadow-lg transition-transform duration-200 ease-out',
              mobileNavOpen ? 'translate-y-0' : '-translate-y-full'
            )}
          >
            <nav className="flex flex-col gap-0.5 p-2">
              {nav.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
        <main className="min-h-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
