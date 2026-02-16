import { createClient } from '@supabase/supabase-js'
import type { Profile } from '@/lib/shared'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Verify Supabase JWT from Authorization: Bearer <token> and return user id.
 */
export async function verifySupabaseToken(
  authHeader: string | undefined
): Promise<{ userId: string; profile?: Profile } | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  if (!token) return null

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { userId: user.id, profile: profile as Profile | null ?? undefined }
}

export function requireAuth(authHeader: string | undefined): Promise<{ userId: string; profile?: Profile }> {
  return verifySupabaseToken(authHeader).then((r) => {
    if (!r) throw new Error('Unauthorized')
    return r
  })
}

const ADMIN_ROLES = ['owner', 'admin', 'manager', 'support'] as const

export function requireAdmin(authHeader: string | undefined): Promise<{ userId: string; profile: Profile }> {
  return verifySupabaseToken(authHeader).then((r) => {
    if (!r) throw new Error('Unauthorized')
    if (!r.profile || !ADMIN_ROLES.includes(r.profile.role as (typeof ADMIN_ROLES)[number])) throw new Error('Forbidden')
    return r as { userId: string; profile: Profile }
  })
}

/** Support can only update order status + notes; no product price edit. */
export function isSupportRole(profile: Profile): boolean {
  return profile.role === 'support'
}
