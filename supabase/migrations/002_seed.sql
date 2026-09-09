-- =============================================================
-- Seed Data for Development
-- =============================================================

-- Categories
INSERT INTO categories (id, name, slug, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Makanan', 'makanan', TRUE),
  ('22222222-2222-2222-2222-222222222222', 'Minuman', 'minuman', TRUE),
  ('33333333-3333-3333-3333-333333333333', 'Snack', 'snack', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Menus
INSERT INTO menus (id, category_id, name, slug, description, price, stock_status, is_active, is_best_seller) VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Nasi Goreng Spesial', 'nasi-goreng-spesial',
   'Nasi goreng dengan telur, ayam, dan sayuran segar', 25000, 'AVAILABLE', TRUE, TRUE),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Mie Ayam Bakso', 'mie-ayam-bakso',
   'Mie ayam dengan bakso sapi kenyal dan kuah kaldu gurih', 20000, 'AVAILABLE', TRUE, FALSE),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Gado-Gado Khas', 'gado-gado-khas',
   'Sayuran segar dengan bumbu kacang lezat', 18000, 'LOW_STOCK', TRUE, FALSE),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Soto Ayam Lamongan', 'soto-ayam-lamongan',
   'Soto ayam khas Lamongan dengan nasi dan pelengkap', 22000, 'OUT_OF_STOCK', TRUE, FALSE),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Es Teh Manis', 'es-teh-manis',
   'Teh manis segar dengan es batu pilihan', 8000, 'AVAILABLE', TRUE, TRUE),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Es Jeruk Peras', 'es-jeruk-peras',
   'Jeruk peras segar tanpa pengawet', 12000, 'AVAILABLE', TRUE, FALSE),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Jus Alpukat', 'jus-alpukat',
   'Jus alpukat creamy dengan susu dan madu', 18000, 'AVAILABLE', TRUE, FALSE),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Gorengan Mix', 'gorengan-mix',
   'Bakwan, tempe, tahu, dan pisang goreng', 10000, 'AVAILABLE', TRUE, FALSE)
ON CONFLICT (slug) DO NOTHING;

-- Business Settings
INSERT INTO business_settings (store_name, store_description, address, maps_url, owner_whatsapp, developer_whatsapp)
VALUES (
  'Warung Makan Barokah',
  'Tempat makan enak dengan harga terjangkau, cocok untuk semua kalangan',
  'Jl. Merdeka No. 123, RT 01/RW 02, Kelurahan Sejahtera, Kota Indah',
  'https://maps.google.com/?q=-6.2088,106.8456',
  '6281234567890',
  '6289876543210'
)
ON CONFLICT DO NOTHING;

-- Operating Hours (Senin-Sabtu buka 08:00-21:00, Minggu buka 09:00-20:00)
INSERT INTO operating_hours (day_of_week, is_open, open_time, close_time) VALUES
  (0, TRUE, '09:00', '20:00'),  -- Minggu
  (1, TRUE, '08:00', '21:00'),  -- Senin
  (2, TRUE, '08:00', '21:00'),  -- Selasa
  (3, TRUE, '08:00', '21:00'),  -- Rabu
  (4, TRUE, '08:00', '21:00'),  -- Kamis
  (5, TRUE, '08:00', '21:00'),  -- Jumat
  (6, TRUE, '08:00', '21:00')   -- Sabtu
ON CONFLICT (day_of_week) DO NOTHING;

-- Promotion Example
INSERT INTO promotions (name, description, discount_type, discount_value, minimum_order, starts_at, ends_at, is_active)
VALUES (
  'Promo Pembukaan',
  'Diskon 10% untuk semua pesanan minimum Rp 30.000',
  'PERCENTAGE',
  10,
  30000,
  NOW(),
  NOW() + INTERVAL '30 days',
  TRUE
)
ON CONFLICT DO NOTHING;
