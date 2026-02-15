import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/backend/auth/verifySupabaseToken'
import { createAdminClient } from '@/lib/backend/supabase/adminClient'

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req.headers.get('authorization') ?? undefined)
    const body = (await req.json()) as {
      id?: string
      email?: string
      full_name?: string
      avatar_url?: string
    }
    const id = body.id ?? auth.userId
    if (id !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()
    const { data: existing } = await supabase.from('profiles').select('id').eq('id', id).single()

    if (existing) {
      const { error } = await supabase
        .from('profiles')
        .update({
          email: body.email ?? undefined,
          full_name: body.full_name ?? undefined,
          avatar_url: body.avatar_url ?? undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true, created: false })
    }

    const { error } = await supabase.from('profiles').insert({
      id,
      email: body.email ?? '',
      full_name: body.full_name ?? null,
      avatar_url: body.avatar_url ?? null,
      role: 'user',
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, created: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Upsert failed'
    const isUnauth = e instanceof Error && e.message === 'Unauthorized'
    return NextResponse.json({ error: message }, { status: isUnauth ? 401 : 500 })
  }
}
