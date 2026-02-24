import type { Metadata } from 'next'
import Link from 'next/link'
import { AdminShell } from '@/components/admin/AdminShell'
import { ApolloProvider } from '@/lib/providers/ApolloProvider'

export const metadata: Metadata = {
  title: 'Admin - AZ Beauty',
  description: 'Admin dashboard',
  robots: 'noindex, nofollow',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ApolloProvider>
      <AdminShell>{children}</AdminShell>
    </ApolloProvider>
  )
}
