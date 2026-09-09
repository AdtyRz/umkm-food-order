-- =============================================================
-- UMKM Kuliner — Initial Migration
-- =============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- PROFILES
-- =============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  full_name   TEXT,
  role        TEXT        NOT NULL DEFAULT 'ADMIN',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- =============================================================
-- CATEGORIES
-- =============================================================
CREATE TABLE IF NOT EXISTS categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active categories"
  ON categories FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admin full access categories"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- =============================================================
-- MENUS
-- =============================================================
CREATE TABLE IF NOT EXISTS menus (
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID            NOT NULL REFERENCES categories(id),
  name            TEXT            NOT NULL,
  slug            TEXT            NOT NULL UNIQUE,
  description     TEXT,
  price           NUMERIC(12,2)   NOT NULL CHECK (price >= 0),
  image_url       TEXT,
  stock_status    TEXT            NOT NULL DEFAULT 'AVAILABLE'
                  CHECK (stock_status IN ('AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK')),
  is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
  is_best_seller  BOOLEAN         NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menus_category_id   ON menus(category_id);
CREATE INDEX idx_menus_is_active     ON menus(is_active);
CREATE INDEX idx_menus_stock_status  ON menus(stock_status);

ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active menus"
  ON menus FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admin full access menus"
  ON menus FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- =============================================================
-- PROMOTIONS — dibuat SEBELUM orders karena orders FK ke promotions
-- =============================================================
CREATE TABLE IF NOT EXISTS promotions (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT          NOT NULL,
  description     TEXT,
  discount_type   TEXT          NOT NULL CHECK (discount_type IN ('NOMINAL', 'PERCENTAGE')),
  discount_value  NUMERIC(12,2) NOT NULL CHECK (discount_value >= 0),
  minimum_order   NUMERIC(12,2) NOT NULL DEFAULT 0,
  starts_at       TIMESTAMPTZ   NOT NULL,
  ends_at         TIMESTAMPTZ   NOT NULL,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (starts_at <= ends_at),
  CONSTRAINT valid_percentage CHECK (
    discount_type != 'PERCENTAGE' OR discount_value <= 100
  )
);

CREATE INDEX idx_promotions_is_active ON promotions(is_active);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active promotions"
  ON promotions FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admin full access promotions"
  ON promotions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- =============================================================
-- ORDERS
-- =============================================================
CREATE TABLE IF NOT EXISTS orders (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     TEXT          NOT NULL UNIQUE,
  public_token     TEXT          NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  customer_name    TEXT          NOT NULL,
  customer_phone   TEXT          NOT NULL,
  notes            TEXT,
  subtotal         NUMERIC(12,2) NOT NULL,
  discount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total            NUMERIC(12,2) NOT NULL,
  payment_method   TEXT          NOT NULL CHECK (payment_method IN ('QRIS', 'COD')),
  payment_status   TEXT          NOT NULL,
  order_status     TEXT          NOT NULL DEFAULT 'PESANAN_MASUK'
                   CHECK (order_status IN (
                     'PESANAN_MASUK','DIKONFIRMASI','SEDANG_DIPROSES',
                     'SIAP_DIAMBIL','SELESAI','DIBATALKAN'
                   )),
  promotion_id     UUID          REFERENCES promotions(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_created_at     ON orders(created_at);
CREATE INDEX idx_orders_order_status   ON orders(order_status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_order_number   ON orders(order_number);
CREATE INDEX idx_orders_public_token   ON orders(public_token);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert order"
  ON orders FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Public read by token"
  ON orders FOR SELECT
  USING (TRUE);

CREATE POLICY "Admin full access orders"
  ON orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- =============================================================
-- ORDER ITEMS
-- =============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_id             UUID          NOT NULL REFERENCES menus(id),
  menu_name_snapshot  TEXT          NOT NULL,
  unit_price          NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  quantity            INTEGER       NOT NULL CHECK (quantity > 0),
  subtotal            NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Public read order items"
  ON order_items FOR SELECT
  USING (TRUE);

CREATE POLICY "Admin full access order_items"
  ON order_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- =============================================================
-- PAYMENTS
-- =============================================================
CREATE TABLE IF NOT EXISTS payments (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID          NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  method       TEXT          NOT NULL CHECK (method IN ('QRIS', 'COD')),
  status       TEXT          NOT NULL,
  verified_by  UUID          REFERENCES profiles(id),
  verified_at  TIMESTAMPTZ,
  paid_at      TIMESTAMPTZ,
  notes        TEXT,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert payment"
  ON payments FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Public read payments"
  ON payments FOR SELECT
  USING (TRUE);

CREATE POLICY "Admin full access payments"
  ON payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- =============================================================
-- BUSINESS SETTINGS (single row)
-- =============================================================
CREATE TABLE IF NOT EXISTS business_settings (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name           TEXT        NOT NULL DEFAULT 'UMKM Kuliner',
  store_description    TEXT,
  address              TEXT,
  maps_url             TEXT,
  owner_whatsapp       TEXT,
  developer_whatsapp   TEXT,
  qris_image_url       TEXT,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read business settings"
  ON business_settings FOR SELECT
  USING (TRUE);

CREATE POLICY "Admin full access business_settings"
  ON business_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- =============================================================
-- OPERATING HOURS
-- =============================================================
CREATE TABLE IF NOT EXISTS operating_hours (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week  INTEGER     NOT NULL UNIQUE CHECK (day_of_week BETWEEN 0 AND 6),
  is_open      BOOLEAN     NOT NULL DEFAULT TRUE,
  open_time    TIME,
  close_time   TIME,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_operating_hours_day ON operating_hours(day_of_week);

ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read operating hours"
  ON operating_hours FOR SELECT
  USING (TRUE);

CREATE POLICY "Admin full access operating_hours"
  ON operating_hours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- =============================================================
-- BUG REPORTS
-- =============================================================
CREATE TABLE IF NOT EXISTS bug_reports (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT,
  phone        TEXT,
  page         TEXT,
  description  TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'OPEN',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert bug report"
  ON bug_reports FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admin read bug reports"
  ON bug_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- =============================================================
-- UPDATED_AT TRIGGER
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON menus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON business_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON operating_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON bug_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- PROFILE AUTO-CREATE ON SIGNUP
-- =============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'ADMIN'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================
-- REALTIME — enable publications
-- =============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE menus;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE business_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE operating_hours;
