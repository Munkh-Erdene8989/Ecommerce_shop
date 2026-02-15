import type { CouponType } from './constants'
import type { Coupon } from './types'
import { applyCouponSchema } from './schemas'

export interface CouponResult {
  valid: boolean
  discount: number
  finalSubtotal: number
  error?: string
}

/**
 * Calculate discount from a coupon applied to a subtotal.
 * Used by both FE (preview) and BE (order creation).
 */
export function calculateCouponDiscount(
  coupon: Pick<Coupon, 'type' | 'value' | 'min_order_amount' | 'used_count' | 'max_uses' | 'valid_from' | 'valid_until'>,
  subtotal: number
): CouponResult {
  const now = new Date().toISOString()
  if (coupon.valid_from && now < coupon.valid_from) {
    return { valid: false, discount: 0, finalSubtotal: subtotal, error: 'Coupon not yet valid' }
  }
  if (coupon.valid_until && now > coupon.valid_until) {
    return { valid: false, discount: 0, finalSubtotal: subtotal, error: 'Coupon expired' }
  }
  if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) {
    return { valid: false, discount: 0, finalSubtotal: subtotal, error: 'Coupon limit reached' }
  }
  if (coupon.min_order_amount != null && subtotal < coupon.min_order_amount) {
    return {
      valid: false,
      discount: 0,
      finalSubtotal: subtotal,
      error: `Minimum order amount is ${coupon.min_order_amount}`,
    }
  }

  let discount = 0
  if (coupon.type === 'percent') {
    discount = Math.round((subtotal * coupon.value) / 100)
  } else {
    discount = Math.min(coupon.value, subtotal)
  }
  const finalSubtotal = Math.max(0, subtotal - discount)
  return { valid: true, discount, finalSubtotal }
}

/**
 * Validate and apply coupon input (for API use).
 */
export function applyCoupon(
  input: { code: string; subtotal: number },
  coupon: Coupon | null
): CouponResult {
  const parsed = applyCouponSchema.safeParse(input)
  if (!parsed.success) {
    return { valid: false, discount: 0, finalSubtotal: input.subtotal, error: 'Invalid input' }
  }
  if (!coupon) {
    return { valid: false, discount: 0, finalSubtotal: parsed.data.subtotal, error: 'Coupon not found' }
  }
  return calculateCouponDiscount(coupon, parsed.data.subtotal)
}
