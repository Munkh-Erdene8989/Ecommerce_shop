import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/backend/auth/verifySupabaseToken'
import { createAdminClient } from '@/lib/backend/supabase/adminClient'

async function upsertProfile(
  token: string,
  data: { id: string; email?: string; full_name?: string; avatar_url?: string }
) {
  const auth = await requireAuth(`Bearer ${token}`)
  const supabase = createAdminClient()
  const id = data.id ?? auth.userId
  if (id !== auth.userId) return
  const { data: existing } = await supabase.from('profiles').select('id').eq('id', id).single()
  if (existing) {
    await supabase
      .from('profiles')
      .update({
        email: data.email ?? undefined,
        full_name: data.full_name ?? undefined,
        avatar_url: data.avatar_url ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
  } else {
    await supabase.from('profiles').insert({
      id,
      email: data.email ?? '',
      full_name: data.full_name ?? null,
      avatar_url: data.avatar_url ?? null,
      role: 'user',
    })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account/orders'

  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !session) {
    return NextResponse.redirect(new URL('/login?error=auth', request.url))
  }

  const token = session.access_token
  try {
    await upsertProfile(token, {
      id: session.user.id,
      email: session.user.email,
      full_name: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name,
      avatar_url: session.user.user_metadata?.avatar_url ?? session.user.user_metadata?.picture,
    })
  } catch (e) {
    console.warn('upsert-profile failed', e)
  }

  return NextResponse.redirect(new URL(next, request.url))
}
