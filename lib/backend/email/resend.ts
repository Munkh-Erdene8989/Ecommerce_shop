import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const EMAIL_FROM = process.env.EMAIL_FROM || 'AZ Beauty <noreply@example.com>'

export async function sendOrderPlacedEmail(to: string, orderId: string, total: number): Promise<void> {
  if (!resend) return
  await resend.emails.send({
    from: EMAIL_FROM,
    to: [to],
    subject: `Захиалга баталгаажлаа #${orderId.slice(0, 8)}`,
    html: `<p>Таны захиалга амжилттай хүлээн авлаа. Дүн: ${total}₮. Захиалга #${orderId.slice(0, 8)}.</p>`,
  })
}

export async function sendPaymentConfirmedEmail(to: string, orderId: string, total: number): Promise<void> {
  if (!resend) return
  await resend.emails.send({
    from: EMAIL_FROM,
    to: [to],
    subject: `Төлбөр төлөгдлөө - Захиалга #${orderId.slice(0, 8)}`,
    html: `<p>Таны төлбөр амжилттай төлөгдлөө. Дүн: ${total}₮. Захиалга #${orderId.slice(0, 8)}.</p>`,
  })
}

export async function sendOrderStatusEmail(to: string, orderId: string, status: string): Promise<void> {
  if (!resend) return
  await resend.emails.send({
    from: EMAIL_FROM,
    to: [to],
    subject: `Захиалгын төлөв шинэчлэгдлээ #${orderId.slice(0, 8)}`,
    html: `<p>Захиалга #${orderId.slice(0, 8)} одоо: ${status}.</p>`,
  })
}
