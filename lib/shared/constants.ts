export const ROLES = ['user', 'admin', 'owner', 'manager', 'support'] as const
export type Role = (typeof ROLES)[number]

export const ORDER_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const COUPON_TYPES = ['percent', 'fixed'] as const
export type CouponType = (typeof COUPON_TYPES)[number]

export const DEFAULT_SHIPPING_COST = 5000
export const FREE_SHIPPING_THRESHOLD = 60000
