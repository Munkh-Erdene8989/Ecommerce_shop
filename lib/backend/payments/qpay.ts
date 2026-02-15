/**
 * QPay Mongolia v2 API
 */

const QPAY_BASE_URL = process.env.QPAY_API_URL || 'https://merchant.qpay.mn/v2'
const QPAY_USERNAME = process.env.QPAY_USERNAME!
const QPAY_PASSWORD = process.env.QPAY_PASSWORD!
const QPAY_INVOICE_CODE = process.env.QPAY_INVOICE_CODE!
const QPAY_CALLBACK_URL = process.env.QPAY_CALLBACK_URL || ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ''

let cachedToken: string | null = null
let tokenExpiry = 0

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken
  const res = await fetch(`${QPAY_BASE_URL}/auth/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${QPAY_USERNAME}:${QPAY_PASSWORD}`).toString('base64'),
      'Content-Type': 'application/json',
    },
    body: '{}',
  })
  if (!res.ok) throw new Error('QPay auth failed')
  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = data.access_token
  tokenExpiry = Date.now() + data.expires_in * 1000 - 60000
  return cachedToken!
}

export interface CreateInvoiceParams {
  senderInvoiceNo: string
  invoiceReceiverCode: string
  invoiceDescription: string
  amount: number
  callbackUrl: string
}

export interface CreateInvoiceResult {
  invoice_id: string
  qr_text: string
  qr_image: string
  urls: { name: string; logo: string; link: string }[]
}

export async function createInvoice(params: CreateInvoiceParams): Promise<CreateInvoiceResult> {
  const token = await getToken()
  const res = await fetch(`${QPAY_BASE_URL}/invoice`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      invoice_code: QPAY_INVOICE_CODE,
      sender_invoice_no: params.senderInvoiceNo,
      invoice_receiver_code: params.invoiceReceiverCode,
      invoice_description: params.invoiceDescription,
      amount: params.amount,
      callback_url: params.callbackUrl,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error('QPay create invoice failed: ' + err)
  }
  const data = (await res.json()) as {
    invoice_id: string
    qr_text: string
    qr_image: string
    urls: { name: string; logo: string; link: string }[]
  }
  return {
    invoice_id: data.invoice_id,
    qr_text: data.qr_text,
    qr_image: data.qr_image ?? '',
    urls: data.urls ?? [],
  }
}

export interface CheckInvoiceResult {
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED'
  payment_id?: string
}

export async function checkInvoice(invoiceId: string): Promise<CheckInvoiceResult> {
  const token = await getToken()
  const res = await fetch(`${QPAY_BASE_URL}/payment/check`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      object_type: 'INVOICE',
      object_id: invoiceId,
      offset: { page_number: 1, page_limit: 100 },
    }),
  })
  if (!res.ok) throw new Error('QPay check failed')
  const data = (await res.json()) as { rows?: { invoice_id: string; payment_status: string; payment_id?: string }[] }
  const row = data.rows?.[0]
  if (!row) return { status: 'PENDING' }
  const status = row.payment_status === 'PAID' ? 'PAID' : row.payment_status === 'CANCEL' ? 'CANCELLED' : 'PENDING'
  return { status, payment_id: row.payment_id }
}

export function getCallbackUrl(orderId: string): string {
  const base = QPAY_CALLBACK_URL || APP_URL || 'http://localhost:3000'
  return `${base}/api/payments/qpay/webhook?order_id=${orderId}`
}
