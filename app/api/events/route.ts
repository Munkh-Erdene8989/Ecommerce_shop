import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/backend/supabase/adminClient'
import { rateLimitEvents } from '@/lib/backend/utils/rateLimit'
import { marketingEventSchema } from '@/lib/shared'

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  const { ok } = rateLimitEvents(ip, 30)
  if (!ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await req.json()
  const parsed = marketingEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('marketing_events').insert({
    event_name: parsed.data.event_name,
    page: parsed.data.page ?? null,
    utm_source: parsed.data.utm_source ?? null,
    utm_medium: parsed.data.utm_medium ?? null,
    utm_campaign: parsed.data.utm_campaign ?? null,
    product_id: parsed.data.product_id ?? null,
    order_id: parsed.data.order_id ?? null,
    value: parsed.data.value ?? null,
    meta: parsed.data.meta ?? null,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true }, { status: 201 })
}
