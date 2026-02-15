-- AZ Beauty - Row Level Security

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_events ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own update/insert
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Brands, categories: public read; admin/owner write (handled by backend with service role)
CREATE POLICY "brands_select" ON public.brands FOR SELECT USING (true);
CREATE POLICY "categories_select" ON public.categories FOR SELECT USING (true);

-- Products: public read; admin/owner CRUD via backend
CREATE POLICY "products_select" ON public.products FOR SELECT USING (true);
CREATE POLICY "product_variants_select" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_own" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Cart: own CRUD
CREATE POLICY "cart_select" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cart_insert" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cart_update" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cart_delete" ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

-- Orders: own read/insert; admin/owner read all, update
CREATE POLICY "orders_select" ON public.orders FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_update" ON public.orders FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

CREATE POLICY "order_items_select" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND (o.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')))
  )
);
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
);

-- Payments: admin/owner read; inserts/updates via backend only
CREATE POLICY "payments_select" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

-- Coupons: admin/owner read; backend writes with service role
CREATE POLICY "coupons_select" ON public.coupons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

-- Inventory: admin/owner read; backend writes
CREATE POLICY "inventory_select" ON public.inventory_movements FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

-- Marketing events: insert via backend only; admin read
CREATE POLICY "marketing_events_select" ON public.marketing_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);
