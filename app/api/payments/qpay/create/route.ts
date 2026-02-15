import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/backend/auth/verifySupabaseToken'
import { createAdminClient } from '@/lib/backend/supabase/adminClient'
import { createInvoice, getCallbackUrl } from '@/lib/backend/payments/qpay'

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req.headers.get('authorization') ?? undefined)
    const body = (await req.json()) as {
      orderId: string
      amount: number
      description?: string
    }
    const { orderId, amount, description } = body

    if (!orderId || amount == null) {
      return NextResponse.json({ error: 'Missing orderId or amount' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, user_id, total, payment_status')
      .eq('id', orderId)
      .eq('user_id', auth.userId)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order already paid' }, { status: 400 })
    }

    const callbackUrl = getCallbackUrl(orderId)
    const invoice = await createInvoice({
      senderInvoiceNo: orderId,
      invoiceReceiverCode: auth.userId,
      invoiceDescription:
        description || `AZ Beauty - Захиалга #${orderId.slice(0, 8)}`,
      amount,
      callbackUrl,
    })

    await supabase.from('payments').insert({
      order_id: orderId,
      qpay_invoice_id: invoice.invoice_id,
      amount,
      status: 'pending',
    })

    await supabase
      .from('orders')
      .update({
        qpay_invoice_id: invoice.invoice_id,
        qpay_qr_text: invoice.qr_text,
        qpay_urls: invoice.urls,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    return NextResponse.json({
      invoice_id: invoice.invoice_id,
      qr_text: invoice.qr_text,
      qr_image: invoice.qr_image,
      urls: invoice.urls,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create invoice'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
