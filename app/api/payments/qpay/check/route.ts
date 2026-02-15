import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/backend/auth/verifySupabaseToken'
import { checkInvoice } from '@/lib/backend/payments/qpay'

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req.headers.get('authorization') ?? undefined)
    const invoiceId = req.nextUrl.searchParams.get('invoice_id')
    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoice_id' }, { status: 400 })
    }

    const result = await checkInvoice(invoiceId)
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
