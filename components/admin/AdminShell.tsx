'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/providers/AuthProvider'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const nav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Бүтээгдэхүүн', icon: Package },
  { href: '/admin/orders', label: 'Захиалга', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Хэрэглэгчид', icon: Users },
  { href: '/admin/inventory', label: 'Нөөц', icon: Warehouse },
  { href: '/admin/promotions/coupons', label: 'Купон', icon: Tag },
  { href: '/admin/marketing', label: 'Маркетинг', icon: Megaphone },
  { href: '/admin/audit', label: 'Audit log', icon: FileText },
  { href: '/admin/settings', label: 'Тохиргоо', icon: Settings },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="fixed left-0 top-0 z-40 h-screen w-56 border-r border-gray-200 bg-white">
        <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-4">
          <Link href="/admin" className="font-semibold text-primary">
            AZ Admin
          </Link>
        </div>
        <nav className="flex flex-col gap-0.5 p-2">
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
      <div className="flex flex-1 flex-col pl-56">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              Дэлгүүр рүү
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user?.email ?? '—'}</span>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Гарах
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
