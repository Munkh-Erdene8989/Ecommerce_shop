import { NextRequest, NextResponse } from 'next/server'
import { verifyResendWebhook, handleEmailReceived } from '@/lib/backend/email/resendWebhook'

/**
 * Resend Receiving Email webhook — event type: email.received
 * Resend Dashboard → Webhooks → Add → event type "email.received" → URL: https://your-domain.com/api/webhooks/resend
 * .env.local: RESEND_WEBHOOK_SECRET=whsec_... (webhook-ийн дэлгэрэнгүй хуудсаас авна)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headers = {
      'svix-id': req.headers.get('svix-id') ?? '',
      'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
      'svix-signature': req.headers.get('svix-signature') ?? '',
    }

    if (!headers['svix-id'] || !headers['svix-signature']) {
      return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 })
    }

    const event = verifyResendWebhook(body, headers)

    if (event.type === 'email.received') {
      await handleEmailReceived(event.data)
      return NextResponse.json({ received: true })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid webhook' },
      { status: 400 }
    )
  }
}
