import type { Role, OrderStatus, PaymentStatus, CouponType } from './constants'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: Role
  created_at: string
  updated_at: string
}

export interface Brand {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  brand: string
  category: string
  price: number
  original_price: number | null
  cost_price: number | null
  image: string
  images: string[] | null
  barcode: string | null
  stock_quantity: number
  rating: number
  reviews_count: number
  description: string
  in_stock: boolean
  skin_type: string[]
  benefits: string[]
  is_featured: boolean
  is_new: boolean
  is_bestseller: boolean
  created_at: string
  updated_at: string
}

export interface Variant {
  id: string
  product_id: string
  sku: string
  name: string
  price_adjustment: number
  stock_quantity: number
  created_at: string
}

export interface Image {
  id: string
  product_id: string
  url: string
  sort_order: number
}

export interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number
  body: string | null
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  total: number
  subtotal: number
  shipping_cost: number
  status: OrderStatus
  payment_method: string
  payment_status: PaymentStatus
  qpay_invoice_id: string | null
  qpay_qr_text: string | null
  qpay_urls: Record<string, unknown> | null
  shipping_address: Record<string, unknown>
  customer_info: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  price: number
  created_at: string
}

export interface Customer {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  created_at: string
  order_count?: number
  total_spent?: number
}

export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  min_order_amount: number | null
  max_uses: number | null
  used_count: number
  valid_from: string | null
  valid_until: string | null
  created_at: string
}

export interface InventoryMovement {
  id: string
  product_id: string
  quantity_delta: number
  reason: string
  reference_id: string | null
  created_at: string
}

export interface MarketingEvent {
  id: string
  event_name: string
  page: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  product_id: string | null
  order_id: string | null
  value: number | null
  meta: Record<string, unknown> | null
  created_at: string
}
