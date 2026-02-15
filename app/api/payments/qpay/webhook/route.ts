import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/backend/supabase/adminClient'
import { sendPaymentConfirmedEmail } from '@/lib/backend/email/resend'

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { object_id?: string; payment_status?: string }
  const invoiceId = body.object_id

  if (!invoiceId) {
    return NextResponse.json({ error: 'Missing object_id' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: payment } = await supabase
    .from('payments')
    .select('order_id')
    .eq('qpay_invoice_id', invoiceId)
    .single()

  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  const status =
    body.payment_status === 'PAID'
      ? 'paid'
      : body.payment_status === 'CANCEL'
        ? 'cancelled'
        : 'pending'

  await supabase
    .from('payments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('qpay_invoice_id', invoiceId)

  if (status === 'paid') {
    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.order_id)

    const { data: order } = await supabase
      .from('orders')
      .select('user_id, total')
      .eq('id', payment.order_id)
      .single()

    if (order) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', order.user_id)
        .single()
      if (profile?.email) {
        await sendPaymentConfirmedEmail(
          profile.email,
          payment.order_id,
          order.total
        ).catch(() => {})
      }
    }
  }

  return NextResponse.json({ ok: true })
}
