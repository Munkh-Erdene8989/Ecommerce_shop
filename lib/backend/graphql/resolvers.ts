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
import { sendOrderPlacedEmail, sendOrderStatusEmail } from '@/lib/backend/email/resend'
import type { GraphQLContext } from './context'

function supabase(_ctx: GraphQLContext) {
  return createAdminClient()
}

async function insertAudit(ctx: GraphQLContext, action: string, entityType: string, entityId: string | null, oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null) {
  const auth = await verifySupabaseToken(ctx.authHeader)
  const db = createAdminClient()
  await db.from('audit_logs').insert({
    user_id: auth?.userId ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_data: oldData ?? {},
    new_data: newData ?? {},
  })
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

    async adminProduct(_: unknown, args: { id: string }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const { data, error } = await supabase(ctx).from('products').select('*').eq('id', args.id).single()
      if (error || !data) return null
      return data
    },

    async adminProductsTotal(_: unknown, args: { filter?: Record<string, unknown> }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const db = supabase(ctx)
      let q = db.from('products').select('id', { count: 'exact', head: true })
      const f = args.filter
      if (f?.category) q = q.eq('category', f.category)
      if (f?.brand) q = q.eq('brand', f.brand)
      if (f?.search) q = q.ilike('name', `%${String(f.search)}%`)
      const { count, error } = await q
      if (error) throw new Error(error.message)
      return count ?? 0
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

    async adminOrdersTotal(_: unknown, args: { status?: string }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      let q = supabase(ctx).from('orders').select('id', { count: 'exact', head: true })
      if (args.status && args.status !== 'all') q = q.eq('status', args.status)
      const { count, error } = await q
      if (error) throw new Error(error.message)
      return count ?? 0
    },

    async adminOrder(_: unknown, args: { id: string }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const { data: order, error } = await supabase(ctx).from('orders').select('*').eq('id', args.id).single()
      if (error || !order) return null
      const { data: items } = await supabase(ctx).from('order_items').select('*').eq('order_id', args.id)
      return { ...order, order_items: items ?? [] }
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

    async adminCustomersTotal(_: unknown, _args: unknown, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const { count, error } = await supabase(ctx).from('profiles').select('id', { count: 'exact', head: true })
      if (error) throw new Error(error.message)
      return count ?? 0
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

    async adminMarketingEvents(_: unknown, args: { paging?: { limit?: number; offset?: number }; event_name?: string; utm_campaign?: string }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      let q = supabase(ctx).from('marketing_events').select('*').order('created_at', { ascending: false })
      if (args.event_name) q = q.eq('event_name', args.event_name)
      if (args.utm_campaign) q = q.eq('utm_campaign', args.utm_campaign)
      const limit = args.paging?.limit ?? 50
      const offset = args.paging?.offset ?? 0
      q = q.range(offset, offset + limit - 1)
      const { data, error } = await q
      if (error) throw new Error(error.message)
      return data ?? []
    },

    async adminMarketingEventsTotal(_: unknown, args: { event_name?: string; utm_campaign?: string }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      let q = supabase(ctx).from('marketing_events').select('id', { count: 'exact', head: true })
      if (args.event_name) q = q.eq('event_name', args.event_name)
      if (args.utm_campaign) q = q.eq('utm_campaign', args.utm_campaign)
      const { count, error } = await q
      if (error) throw new Error(error.message)
      return count ?? 0
    },

    async adminCoupons(_: unknown, args: { paging?: { limit?: number; offset?: number } }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const limit = args.paging?.limit ?? 50
      const offset = args.paging?.offset ?? 0
      const { data, error } = await supabase(ctx).from('coupons').select('*').order('created_at', { ascending: false }).range(offset, offset + limit - 1)
      if (error) throw new Error(error.message)
      return data ?? []
    },

    async adminCouponsTotal(_: unknown, _args: unknown, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const { count, error } = await supabase(ctx).from('coupons').select('id', { count: 'exact', head: true })
      if (error) throw new Error(error.message)
      return count ?? 0
    },

    async storeSettings(_: unknown, _args: unknown, ctx: GraphQLContext) {
      const db = supabase(ctx)
      const { data, error } = await db.from('store_settings').select('value').eq('key', 'general').single()
      if (error || !data?.value) return { store_name: 'AZ Beauty', logo_url: '', shipping_rate: 5000, free_shipping_threshold: 60000, tax_rate: 0 }
      const v = data.value as Record<string, unknown>
      return {
        store_name: v.store_name ?? 'AZ Beauty',
        logo_url: v.logo_url ?? '',
        shipping_rate: v.shipping_rate ?? 5000,
        free_shipping_threshold: v.free_shipping_threshold ?? 60000,
        tax_rate: v.tax_rate ?? 0,
      }
    },

    async adminAuditLogs(_: unknown, args: { paging?: { limit?: number; offset?: number }; entity_type?: string }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      let q = supabase(ctx).from('audit_logs').select('id, user_id, action, entity_type, entity_id, created_at').order('created_at', { ascending: false })
      if (args.entity_type) q = q.eq('entity_type', args.entity_type)
      const limit = args.paging?.limit ?? 50
      const offset = args.paging?.offset ?? 0
      q = q.range(offset, offset + limit - 1)
      const { data, error } = await q
      if (error) throw new Error(error.message)
      return data ?? []
    },

    async adminAuditLogsTotal(_: unknown, args: { entity_type?: string }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      let q = supabase(ctx).from('audit_logs').select('id', { count: 'exact', head: true })
      if (args.entity_type) q = q.eq('entity_type', args.entity_type)
      const { count, error } = await q
      if (error) throw new Error(error.message)
      return count ?? 0
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
      await insertAudit(ctx, 'create', 'product', data.id, null, data as unknown as Record<string, unknown>)
      return data
    },

    async updateProduct(_: unknown, args: { input: Record<string, unknown> }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const parsed = updateProductSchema.safeParse(args.input)
      if (!parsed.success) throw new Error(parsed.error.message)
      const { id, ...rest } = parsed.data
      const { data: oldRow } = await supabase(ctx).from('products').select('*').eq('id', id).single()
      const row: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() }
      if (rest.slug === undefined) delete row.slug
      const { data, error } = await supabase(ctx).from('products').update(row).eq('id', id).select().single()
      if (error) throw new Error(error.message)
      await insertAudit(ctx, 'update', 'product', id, oldRow as unknown as Record<string, unknown>, data as unknown as Record<string, unknown>)
      return data
    },

    async deleteProduct(_: unknown, args: { id: string }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const { data: oldRow } = await supabase(ctx).from('products').select('*').eq('id', args.id).single()
      const { error } = await supabase(ctx).from('products').delete().eq('id', args.id)
      if (error) throw new Error(error.message)
      await insertAudit(ctx, 'delete', 'product', args.id, oldRow as unknown as Record<string, unknown>, null)
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
      await insertAudit(ctx, 'inventory_adjust', 'inventory_movement', null, { product_id: parsed.data.product_id, previous_qty: product.stock_quantity }, { product_id: parsed.data.product_id, quantity_delta: parsed.data.quantity_delta, new_qty: newQty, reason: parsed.data.reason })
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
      const { data: oldOrder } = await supabase(ctx).from('orders').select('status, user_id').eq('id', parsed.data.order_id).single()
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (parsed.data.status !== undefined) updates.status = parsed.data.status
      if (parsed.data.payment_status !== undefined) updates.payment_status = parsed.data.payment_status
      if ((parsed.data as { internal_notes?: string }).internal_notes !== undefined) updates.internal_notes = (parsed.data as { internal_notes?: string }).internal_notes
      const { data, error } = await supabase(ctx).from('orders').update(updates).eq('id', parsed.data.order_id).select().single()
      if (error) throw new Error(error.message)
      if (parsed.data.status !== undefined && oldOrder?.status !== parsed.data.status && oldOrder?.user_id) {
        const { data: profile } = await supabase(ctx).from('profiles').select('email').eq('id', oldOrder.user_id).single()
        if (profile?.email) await sendOrderStatusEmail(profile.email, parsed.data.order_id, String(parsed.data.status)).catch(() => {})
      }
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

    async updateCoupon(_: unknown, args: { input: Record<string, unknown> }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const input = args.input as { id: string; code?: string; type?: string; value?: number; min_order_amount?: number | null; max_uses?: number | null; valid_from?: string | null; valid_until?: string | null }
      if (!input.id) throw new Error('id required')
      const updates: Record<string, unknown> = {}
      if (input.code !== undefined) updates.code = input.code
      if (input.type !== undefined) updates.type = input.type
      if (input.value !== undefined) updates.value = input.value
      if (input.min_order_amount !== undefined) updates.min_order_amount = input.min_order_amount
      if (input.max_uses !== undefined) updates.max_uses = input.max_uses
      if (input.valid_from !== undefined) updates.valid_from = input.valid_from
      if (input.valid_until !== undefined) updates.valid_until = input.valid_until
      if (Object.keys(updates).length === 0) {
        const { data } = await supabase(ctx).from('coupons').select('*').eq('id', input.id).single()
        return data
      }
      const { data, error } = await supabase(ctx).from('coupons').update(updates).eq('id', input.id).select().single()
      if (error) throw new Error(error.message)
      return data
    },

    async deleteCoupon(_: unknown, args: { id: string }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const { error } = await supabase(ctx).from('coupons').delete().eq('id', args.id)
      if (error) throw new Error(error.message)
      return true
    },

    async updateStoreSettings(_: unknown, args: { input: Record<string, unknown> }, ctx: GraphQLContext) {
      await requireAdmin(ctx.authHeader)
      const input = args.input as Record<string, unknown>
      const value = {
        store_name: input.store_name ?? undefined,
        logo_url: input.logo_url ?? undefined,
        shipping_rate: input.shipping_rate ?? undefined,
        free_shipping_threshold: input.free_shipping_threshold ?? undefined,
        tax_rate: input.tax_rate ?? undefined,
      }
      const db = supabase(ctx)
      const { data: existing } = await db.from('store_settings').select('value').eq('key', 'general').single()
      const merged = { ...(existing?.value as Record<string, unknown> ?? {}), ...value }
      const { error } = await db.from('store_settings').upsert({ key: 'general', value: merged, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      if (error) throw new Error(error.message)
      return { ...merged, store_name: merged.store_name ?? 'AZ Beauty', logo_url: merged.logo_url ?? '', shipping_rate: merged.shipping_rate ?? 5000, free_shipping_threshold: merged.free_shipping_threshold ?? 60000, tax_rate: merged.tax_rate ?? 0 }
    },
  },

  Order: {
    order_items(parent: { id: string }, _: unknown, ctx: GraphQLContext) {
      return supabase(ctx).from('order_items').select('*').eq('order_id', parent.id).then((r) => r.data ?? [])
    },
  },
}
