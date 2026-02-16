-- Admin dashboard: audit_logs, store_settings, order internal_notes, is_admin(), extended roles

-- Extend profiles.role to include manager, support
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin', 'owner', 'manager', 'support'));

-- Order internal notes (admin only)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS internal_notes TEXT DEFAULT '';

-- Store settings (single-tenant: one row or key-value; we use one row with JSON for flexibility)
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default store settings if not exists
INSERT INTO public.store_settings (key, value)
VALUES ('general', '{"store_name":"AZ Beauty","logo_url":"","shipping_rate":5000,"free_shipping_threshold":60000,"tax_rate":0}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Audit log (admin actions)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- SQL helper: is_admin() -> true if role IN ('owner','admin','manager','support')
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = uid AND role IN ('owner', 'admin', 'manager', 'support')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS for new tables
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- store_settings: public read (for storefront); only backend/service_role writes
CREATE POLICY "store_settings_select" ON public.store_settings FOR SELECT USING (true);

-- audit_logs: admin read only; inserts via backend only
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT USING (public.is_admin());

-- Update orders RLS to allow admin/manager/support for update (for internal_notes and status)
DROP POLICY IF EXISTS "orders_update" ON public.orders;
CREATE POLICY "orders_update" ON public.orders FOR UPDATE USING (
  auth.uid() = user_id OR public.is_admin()
);

-- Allow admin roles (owner, admin, manager, support) to read orders, coupons, inventory, marketing
DROP POLICY IF EXISTS "payments_select" ON public.payments;
CREATE POLICY "payments_select" ON public.payments FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "coupons_select" ON public.coupons;
CREATE POLICY "coupons_select" ON public.coupons FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "inventory_select" ON public.inventory_movements;
CREATE POLICY "inventory_select" ON public.inventory_movements FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "marketing_events_select" ON public.marketing_events;
CREATE POLICY "marketing_events_select" ON public.marketing_events FOR SELECT USING (public.is_admin());

-- orders_select: allow is_admin()
DROP POLICY IF EXISTS "orders_select" ON public.orders;
CREATE POLICY "orders_select" ON public.orders FOR SELECT USING (
  auth.uid() = user_id OR public.is_admin()
);

-- order_items_select: allow is_admin()
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND (o.user_id = auth.uid() OR public.is_admin())
  )
);
