import { createAdminClient } from '@/lib/backend/supabase/adminClient'
import { requireAuth, requireAdmin, verifySupabaseToken } from '@/lib/backend/auth/verifySupabaseToken'
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  createCouponSchema,
} from '@/lib/shared'
import { calculateCouponDiscount } from '@/lib/shared'
import { sendOrderPlacedEmail } from '@/lib/backend/email/resend'
import type { GraphQLContext } from './context'

function supabase(_ctx: GraphQLContext) {
  return createAdminClient()
}

export const resolvers = {
  Query: {
    async me(_: unknown, __: unknown, ctx: GraphQLContext) {
      if (!ctx.authHeader) return null
      const auth = await verifySupabaseToken(ctx.authHeader)
      if (!auth?.profile) return null
      return auth.profile
    },

    async products(_: unknown, args: { filter?: Record<string, unknown>; sort?: string; limit?: number; offset?: number }, ctx: GraphQLContext) {
      const db = supabase(ctx)
      let q = db.from('products').select('*')
      const f = args.filter
      if (f?.category) q = q.eq('category', f.category)
      if (f?.brand) q = q.eq('brand', f.brand)
      if (f?.search) q = q.ilike('name', `%${String(f.search)}%`)
      if (f?.in_stock !== undefined) q = q.eq('in_stock', !!f.in_stock)
      if (f?.is_featured !== undefined) q = q.eq('is_featured', !!f.is_featured)
      q = q.order('created_at', { ascending: false })
      if (args.limit) q = q.limit(args.limit)
      if (args.offset) q = q.range(args.offset, args.offset + (args.limit ?? 10) - 1)
      const { data, error } = await q
      if (error) throw new Error(error.message)
      return data ?? []
    },

    async productBySlug(_: unknown, args: { slug: string }, ctx: GraphQLContext) {
      const { data, error } = await supabase(ctx).from('products').select('*').eq('slug', args.slug).single()
      if (error || !data) return null
      return data
    },

    async categories(_: unknown, __: unknown, ctx: GraphQLContext) {
      const { data, error } = await supabase(ctx).from('categories').select('*').order('slug')
      if (error) throw new Error(error.message)
      return data ?? []
    },

    async brands(_: unknown, __: unknown, ctx: GraphQLContext) {
      const { data, error } = await supabase(ctx).from('brands').select('*').order('slug')
      if (error) throw new Error(error.message)
      return data ?? []
    },

    async adminProducts(_: unknown, args: { paging?: { limit?: number; offset?: number }; filter?: Record<string, unknown> }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const db = supabase(ctx)
      let q = db.from('products').select('*')
      const f = args.filter
      if (f?.category) q = q.eq('category', f.category)
      if (f?.brand) q = q.eq('brand', f.brand)
      if (f?.search) q = q.ilike('name', `%${String(f.search)}%`)
      q = q.order('created_at', { ascending: false })
      const limit = args.paging?.limit ?? 50
      const offset = args.paging?.offset ?? 0
      q = q.range(offset, offset + limit - 1)
      const { data, error } = await q
      if (error) throw new Error(error.message)
      return data ?? []
    },

    async myOrders(_: unknown, args: { paging?: { limit?: number; offset?: number } }, ctx: GraphQLContext) {
      const auth = await requireAuth(ctx.authHeader)
      const limit = args.paging?.limit ?? 50
      const offset = args.paging?.offset ?? 0
      const { data: orders, error } = await supabase(ctx)
        .from('orders')
        .select('*')
        .eq('user_id', auth.userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      if (error) throw new Error(error.message)
      if (!orders?.length) return []
      const orderItems = await Promise.all(
        orders.map((o: { id: string }) => supabase(ctx).from('order_items').select('*').eq('order_id', o.id))
      )
      return orders.map((o: { id: string }, i: number) => ({
        ...o,
        order_items: orderItems[i]?.data ?? [],
      }))
    },

    async adminOrders(_: unknown, args: { paging?: { limit?: number; offset?: number }; status?: string }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      let q = supabase(ctx).from('orders').select('*').order('created_at', { ascending: false })
      if (args.status && args.status !== 'all') q = q.eq('status', args.status)
      const limit = args.paging?.limit ?? 50
      const offset = args.paging?.offset ?? 0
      q = q.range(offset, offset + limit - 1)
      const { data: orders, error } = await q
      if (error) throw new Error(error.message)
      if (!orders?.length) return []
      const orderItems = await Promise.all(
        orders.map((o: { id: string }) => supabase(ctx).from('order_items').select('*').eq('order_id', o.id))
      )
      return orders.map((o: { id: string }, i: number) => ({
        ...o,
        order_items: orderItems[i]?.data ?? [],
      }))
    },

    async adminCustomers(_: unknown, args: { paging?: { limit?: number; offset?: number } }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const limit = args.paging?.limit ?? 50
      const offset = args.paging?.offset ?? 0
      const { data: profiles, error } = await supabase(ctx)
        .from('profiles')
        .select('id, email, full_name, phone, created_at')
        .range(offset, offset + limit - 1)
      if (error) throw new Error(error.message)
      if (!profiles?.length) return []
      const customers = await Promise.all(
        profiles.map(async (p: { id: string }) => {
          const { data: orders } = await supabase(ctx).from('orders').select('id, total').eq('user_id', p.id)
          const totalSpent = (orders ?? []).reduce((s: number, o: { total: number }) => s + o.total, 0)
          return { ...p, order_count: (orders ?? []).length, total_spent: totalSpent }
        })
      )
      return customers
    },

    async dashboardStats(_: unknown, _args: { range?: string }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const db = supabase(ctx)
      const { data: orders } = await db.from('orders').select('id, total, status, payment_status, created_at')
      const { data: products } = await db.from('products').select('id, in_stock')
      const paidOrders = (orders ?? []).filter((o: { payment_status: string }) => o.payment_status === 'paid')
      const totalRevenue = paidOrders.reduce((s: number, o: { total: number }) => s + o.total, 0)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const recentOrdersCount = (orders ?? []).filter((o: { created_at: string }) => new Date(o.created_at) >= sevenDaysAgo).length
      return {
        totalRevenue,
        totalOrders: (orders ?? []).length,
        pendingOrders: (orders ?? []).filter((o: { status: string }) => o.status === 'pending').length,
        totalProducts: (products ?? []).length,
        outOfStock: (products ?? []).filter((p: { in_stock: boolean }) => !p.in_stock).length,
        recentOrdersCount,
      }
    },

    async marketingEventCounts(_: unknown, _args: { range?: string }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const { data, error } = await supabase(ctx)
        .from('marketing_events')
        .select('event_name')
      if (error) throw new Error(error.message)
      const counts: Record<string, number> = {}
      ;(data ?? []).forEach((r: { event_name: string }) => {
        counts[r.event_name] = (counts[r.event_name] ?? 0) + 1
      })
      return Object.entries(counts).map(([event_name, count]) => ({ event_name, count }))
    },
  },

  Mutation: {
    async upsertProfileIfMissing(_: unknown, args: { id?: string; email?: string; full_name?: string; avatar_url?: string }, ctx: GraphQLContext) {
      const auth = await requireAuth(ctx.authHeader)
      const db = supabase(ctx)
      const id = args.id ?? auth.userId
      if (id !== auth.userId) throw new Error('Forbidden')
      const { data: existing } = await db.from('profiles').select('*').eq('id', id).single()
      const payload = {
        email: args.email ?? existing?.email ?? '',
        full_name: args.full_name ?? existing?.full_name ?? null,
        avatar_url: args.avatar_url ?? existing?.avatar_url ?? null,
        updated_at: new Date().toISOString(),
      }
      if (existing) {
        const { data: updated, error } = await db.from('profiles').update(payload).eq('id', id).select().single()
        if (error) throw new Error(error.message)
        return updated
      }
      const { data: inserted, error } = await db.from('profiles').insert({ id, ...payload, role: 'user' }).select().single()
      if (error) throw new Error(error.message)
      return inserted
    },

    async createOrUpdateProduct(_: unknown, args: { input: Record<string, unknown> }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const parsed = createProductSchema.safeParse(args.input)
      if (!parsed.success) throw new Error(parsed.error.message)
      const p = parsed.data
      const slug = p.slug ?? p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const row = {
        name: p.name,
        slug,
        brand: p.brand,
        category: p.category,
        price: p.price,
        original_price: p.original_price ?? null,
        cost_price: p.cost_price ?? null,
        image: p.image ?? 'https://via.placeholder.com/300x300?text=No+Image',
        images: p.images ?? null,
        barcode: p.barcode ?? null,
        stock_quantity: p.stock_quantity,
        description: p.description,
        in_stock: p.stock_quantity > 0,
        skin_type: p.skin_type,
        benefits: p.benefits,
        is_featured: p.is_featured,
        is_new: p.is_new,
        is_bestseller: p.is_bestseller,
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await supabase(ctx).from('products').insert(row).select().single()
      if (error) throw new Error(error.message)
      return data
    },

    async updateProduct(_: unknown, args: { input: Record<string, unknown> }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const parsed = updateProductSchema.safeParse(args.input)
      if (!parsed.success) throw new Error(parsed.error.message)
      const { id, ...rest } = parsed.data
      const row: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() }
      if (rest.slug === undefined) delete row.slug
      const { data, error } = await supabase(ctx).from('products').update(row).eq('id', id).select().single()
      if (error) throw new Error(error.message)
      return data
    },

    async deleteProduct(_: unknown, args: { id: string }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const { error } = await supabase(ctx).from('products').delete().eq('id', args.id)
      if (error) throw new Error(error.message)
      return true
    },

    async adjustInventory(_: unknown, args: { input: Record<string, unknown> }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const parsed = updateStockSchema.safeParse(args.input)
      if (!parsed.success) throw new Error(parsed.error.message)
      const db = supabase(ctx)
      const { data: product } = await db.from('products').select('stock_quantity').eq('id', parsed.data.product_id).single()
      if (!product) throw new Error('Product not found')
      const newQty = Math.max(0, (product.stock_quantity ?? 0) + parsed.data.quantity_delta)
      await db.from('products').update({ stock_quantity: newQty, in_stock: newQty > 0, updated_at: new Date().toISOString() }).eq('id', parsed.data.product_id)
      await db.from('inventory_movements').insert({
        product_id: parsed.data.product_id,
        quantity_delta: parsed.data.quantity_delta,
        reason: parsed.data.reason,
        reference_id: parsed.data.reference_id ?? null,
      })
      return true
    },

    async createOrder(_: unknown, args: { input: Record<string, unknown> }, ctx: GraphQLContext) {
      const auth = await requireAuth(ctx.authHeader)
      const parsed = createOrderSchema.safeParse({ ...args.input, user_id: auth.userId })
      if (!parsed.success) throw new Error(parsed.error.message)
      const db = supabase(ctx)
      let subtotal = parsed.data.subtotal
      let discount = 0
      let couponId: string | null = null
      if (parsed.data.coupon_code) {
        const { data: coupon } = await db.from('coupons').select('*').eq('code', parsed.data.coupon_code).single()
        if (coupon) {
          const result = calculateCouponDiscount(coupon, parsed.data.subtotal)
          if (result.valid) {
            discount = result.discount
            subtotal = result.finalSubtotal
            couponId = coupon.id
          }
        }
      }
      const total = subtotal + parsed.data.shipping_cost
      const orderRow = {
        user_id: auth.userId,
        subtotal,
        total,
        shipping_cost: parsed.data.shipping_cost,
        payment_method: parsed.data.payment_method ?? 'qpay',
        shipping_address: parsed.data.shipping_address,
        customer_info: parsed.data.customer_info,
        coupon_id: couponId,
        status: 'pending',
        payment_status: 'pending',
      }
      const { data: order, error: orderErr } = await db.from('orders').insert(orderRow).select().single()
      if (orderErr) throw new Error(orderErr.message)
      const items = parsed.data.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
      }))
      const { error: itemsErr } = await db.from('order_items').insert(items)
      if (itemsErr) {
        await db.from('orders').delete().eq('id', order.id)
        throw new Error(itemsErr.message)
      }
      if (couponId) {
        const { data: c } = await db.from('coupons').select('used_count').eq('id', couponId).single()
        if (c) await db.from('coupons').update({ used_count: (c.used_count ?? 0) + 1 }).eq('id', couponId)
      }
      const profile = await db.from('profiles').select('email').eq('id', auth.userId).single()
      if (profile?.data?.email) await sendOrderPlacedEmail(profile.data.email, order.id, total).catch(() => {})
      return { ...order, order_items: items }
    },

    async updateOrderStatus(_: unknown, args: { input: Record<string, unknown> }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const parsed = updateOrderStatusSchema.safeParse(args.input)
      if (!parsed.success) throw new Error(parsed.error.message)
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (parsed.data.status) updates.status = parsed.data.status
      if (parsed.data.payment_status) updates.payment_status = parsed.data.payment_status
      const { data, error } = await supabase(ctx).from('orders').update(updates).eq('id', parsed.data.order_id).select().single()
      if (error) throw new Error(error.message)
      const { data: items } = await supabase(ctx).from('order_items').select('*').eq('order_id', parsed.data.order_id)
      return { ...data, order_items: items ?? [] }
    },

    async createCoupon(_: unknown, args: { input: Record<string, unknown> }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const parsed = createCouponSchema.safeParse(args.input)
      if (!parsed.success) throw new Error(parsed.error.message)
      const { data, error } = await supabase(ctx).from('coupons').insert({
        code: parsed.data.code,
        type: parsed.data.type,
        value: parsed.data.value,
        min_order_amount: parsed.data.min_order_amount ?? null,
        max_uses: parsed.data.max_uses ?? null,
        used_count: 0,
        valid_from: parsed.data.valid_from ?? null,
        valid_until: parsed.data.valid_until ?? null,
      }).select().single()
      if (error) throw new Error(error.message)
      return data
    },

    async deleteCoupon(_: unknown, args: { id: string }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const { error } = await supabase(ctx).from('coupons').delete().eq('id', args.id)
      if (error) throw new Error(error.message)
      return true
    },
  },

  Order: {
    order_items(parent: { id: string }, _: unknown, ctx: GraphQLContext) {
      return supabase(ctx).from('order_items').select('*').eq('order_id', parent.id).then((r) => r.data ?? [])
    },
  },
}
