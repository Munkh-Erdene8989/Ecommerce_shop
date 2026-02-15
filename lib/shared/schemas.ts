import { z } from 'zod'
import { COUPON_TYPES, ORDER_STATUSES } from './constants'

export const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  brand: z.string().default(''),
  category: z.string().default('skincare'),
  price: z.number().int().min(0),
  original_price: z.number().int().min(0).nullable().optional(),
  cost_price: z.number().int().min(0).nullable().optional(),
  image: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  barcode: z.string().nullable().optional(),
  stock_quantity: z.number().int().min(0).default(0),
  description: z.string().default(''),
  skin_type: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  is_featured: z.boolean().default(false),
  is_new: z.boolean().default(false),
  is_bestseller: z.boolean().default(false),
})
export type CreateProductInput = z.infer<typeof createProductSchema>

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().uuid(),
})
export type UpdateProductInput = z.infer<typeof updateProductSchema>

export const updateStockSchema = z.object({
  product_id: z.string().uuid(),
  quantity_delta: z.number().int(),
  reason: z.string().min(1),
  reference_id: z.string().uuid().nullable().optional(),
})
export type UpdateStockInput = z.infer<typeof updateStockSchema>

export const createOrderItemSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string().min(1),
  quantity: z.number().int().min(1),
  price: z.number().int().min(0),
})
export const createOrderSchema = z.object({
  user_id: z.string().uuid(),
  subtotal: z.number().int().min(0),
  shipping_cost: z.number().int().min(0),
  total: z.number().int().min(0),
  payment_method: z.string().default('qpay'),
  shipping_address: z.record(z.unknown()),
  customer_info: z.record(z.unknown()),
  items: z.array(createOrderItemSchema).min(1),
  coupon_code: z.string().optional(),
})
export type CreateOrderInput = z.infer<typeof createOrderSchema>

export const updateOrderStatusSchema = z.object({
  order_id: z.string().uuid(),
  status: z.enum(ORDER_STATUSES as unknown as [string, ...string[]]).optional(),
  payment_status: z.enum(['pending', 'paid', 'failed']).optional(),
})
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>

export const applyCouponSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().min(0),
})
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>

export const createCouponSchema = z.object({
  code: z.string().min(1).max(50),
  type: z.enum(COUPON_TYPES as unknown as [string, ...string[]]),
  value: z.number().min(0),
  min_order_amount: z.number().int().min(0).nullable().optional(),
  max_uses: z.number().int().min(0).nullable().optional(),
  valid_from: z.string().datetime().optional(),
  valid_until: z.string().datetime().optional(),
})
export type CreateCouponInput = z.infer<typeof createCouponSchema>

export const marketingEventSchema = z.object({
  event_name: z.string().min(1).max(100),
  page: z.string().max(500).nullable().optional(),
  utm_source: z.string().max(200).nullable().optional(),
  utm_medium: z.string().max(200).nullable().optional(),
  utm_campaign: z.string().max(200).nullable().optional(),
  product_id: z.string().uuid().nullable().optional(),
  order_id: z.string().uuid().nullable().optional(),
  value: z.number().nullable().optional(),
  meta: z.record(z.unknown()).nullable().optional(),
})
export type MarketingEventInput = z.infer<typeof marketingEventSchema>
