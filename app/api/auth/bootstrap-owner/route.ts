import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/backend/auth/verifySupabaseToken'
import { createAdminClient } from '@/lib/backend/supabase/adminClient'

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req.headers.get('authorization') ?? undefined)
    const supabase = createAdminClient()

    const { data: existingOwner } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['owner'])
      .limit(1)
      .single()

    if (existingOwner) {
      return NextResponse.json({ error: 'Owner already exists' }, { status: 400 })
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: 'owner', updated_at: new Date().toISOString() })
      .eq('id', auth.userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, role: 'owner' })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Bootstrap failed'
    const isUnauth = e instanceof Error && e.message === 'Unauthorized'
    return NextResponse.json({ error: message }, { status: isUnauth ? 401 : 500 })
  }
}
