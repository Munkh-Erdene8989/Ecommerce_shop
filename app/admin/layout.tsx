import type { Metadata } from 'next'
import { AdminShell } from '@/components/admin/AdminShell'
import { ApolloProvider } from '@/lib/providers/ApolloProvider'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase.from('store_settings').select('value').eq('key', 'general').single()
  const v = (data?.value as { store_name?: string } | null) ?? {}
  const storeName = typeof v.store_name === 'string' && v.store_name.trim() ? v.store_name : 'Admin'
  return {
    title: `Admin - ${storeName}`,
    description: 'Admin dashboard',
    robots: 'noindex, nofollow',
  }
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
