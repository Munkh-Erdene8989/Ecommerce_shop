import { Webhook } from 'svix'

export type ResendEmailReceivedData = {
  email_id: string
  created_at: string
  from: string
  to: string[]
  bcc: string[]
  cc: string[]
  message_id: string | null
  subject: string
  attachments: Array<{
    id: string
    filename: string
    content_type: string
    content_disposition: string
    content_id?: string
  }>
}

export type ResendWebhookPayload = {
  type: 'email.received'
  created_at: string
  data: ResendEmailReceivedData
}

/**
 * Resend webhook-ийг Svix secret-ээр баталгаажуулна.
 * Raw body (string) болон svix-id, svix-timestamp, svix-signature header-ууд шаардлагатай.
 */
export function verifyResendWebhook(
  payload: string,
  headers: { 'svix-id'?: string; 'svix-timestamp'?: string; 'svix-signature'?: string }
): ResendWebhookPayload {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('RESEND_WEBHOOK_SECRET is not set')
  }
  const wh = new Webhook(secret)
  const parsed = wh.verify(payload, headers) as ResendWebhookPayload
  return parsed
}

/**
 * email.received ивент болсон үед дуудагдах handler.
 * Имайл метадата (from, to, subject, attachments) ашиглаж DB хадгалах, форвард хийх гэх мэт.
 */
export async function handleEmailReceived(data: ResendEmailReceivedData): Promise<void> {
  // Одоогоор лог / ирээдүйд DB хадгалах, support руу дамжуулах гэх мэт
  // Webhook payload-д body/attachments агуулаагүй; бүтэн контентыг Resend Received API-аар татах боломжтой
  await Promise.resolve()
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[Resend email.received]', data.email_id, data.from, data.to, data.subject)
  }
}
