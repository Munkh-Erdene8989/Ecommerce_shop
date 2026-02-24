import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/backend/auth/verifySupabaseToken'
import { checkInvoice } from '@/lib/backend/payments/qpay'
import { createAdminClient } from '@/lib/backend/supabase/adminClient'
import { sendPaymentConfirmedEmail } from '@/lib/backend/email/resend'

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req.headers.get('authorization') ?? undefined)
    const invoiceId = req.nextUrl.searchParams.get('invoice_id')
    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoice_id' }, { status: 400 })
    }

    const result = await checkInvoice(invoiceId)

    if (result.status === 'PAID') {
      const supabase = createAdminClient()

      const { data: payment } = await supabase
        .from('payments')
        .select('order_id, status')
        .eq('qpay_invoice_id', invoiceId)
        .single()

      if (payment && payment.status !== 'paid') {
        await supabase
          .from('payments')
          .update({ status: 'paid', updated_at: new Date().toISOString() })
          .eq('qpay_invoice_id', invoiceId)

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
            await sendPaymentConfirmedEmail(profile.email, payment.order_id, order.total).catch(() => {})
          }
        }
      }
    }

    return NextResponse.json({
      status: result.status,
      payment_id: result.payment_id,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Check failed'
    const isUnauth = e instanceof Error && e.message === 'Unauthorized'
    return NextResponse.json({ error: message }, { status: isUnauth ? 401 : 500 })
  }
}
