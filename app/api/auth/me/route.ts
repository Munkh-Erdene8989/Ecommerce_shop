import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/backend/auth/verifySupabaseToken'
import { createAdminClient } from '@/lib/backend/supabase/adminClient'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req.headers.get('authorization') ?? undefined)
    const supabase = createAdminClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', auth.userId)
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    return NextResponse.json(profile)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
