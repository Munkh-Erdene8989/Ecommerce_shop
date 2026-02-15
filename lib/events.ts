export async function trackEvent(
  accessToken: string | null,
  event: {
    event_name: string
    page?: string | null
    utm_source?: string | null
    utm_medium?: string | null
    utm_campaign?: string | null
    product_id?: string | null
    order_id?: string | null
    value?: number | null
    meta?: Record<string, unknown> | null
  }
) {
  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify(event),
    })
  } catch {}
}
