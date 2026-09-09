// ============================================================
// Database Types (matches Supabase schema exactly)
// ============================================================

export type StockStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK'
export type OrderStatus =
  | 'PESANAN_MASUK'
  | 'DIKONFIRMASI'
  | 'SEDANG_DIPROSES'
  | 'SIAP_DIAMBIL'
  | 'SELESAI'
  | 'DIBATALKAN'
export type PaymentMethod = 'QRIS' | 'COD'
export type PaymentStatus =
  | 'MENUNGGU_PEMBAYARAN'
  | 'MENUNGGU_VERIFIKASI'
  | 'DITERIMA'
  | 'DITOLAK'
  | 'COD'
export type DiscountType = 'NOMINAL' | 'PERCENTAGE'
export type UserRole = 'ADMIN'
export type BugReportStatus = 'OPEN' | 'CLOSED'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Menu {
  id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  price: number
  image_url: string | null
  stock_status: StockStatus
  is_active: boolean
  is_best_seller: boolean
  created_at: string
  updated_at: string
  category?: Category
}

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  notes: string | null
  subtotal: number
  discount: number
  total: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  order_status: OrderStatus
  promotion_id: string | null
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
  payment?: Payment
}

export interface OrderItem {
  id: string
  order_id: string
  menu_id: string
  menu_name_snapshot: string
  unit_price: number
  quantity: number
  subtotal: number
  created_at: string
  menu?: Menu
}

export interface Payment {
  id: string
  order_id: string
  method: PaymentMethod
  status: PaymentStatus
  verified_by: string | null
  verified_at: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Promotion {
  id: string
  name: string
  description: string | null
  discount_type: DiscountType
  discount_value: number
  minimum_order: number
  starts_at: string
  ends_at: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BusinessSettings {
  id: string
  store_name: string
  store_description: string | null
  address: string | null
  maps_url: string | null
  owner_whatsapp: string | null
  developer_whatsapp: string | null
  qris_image_url: string | null
  updated_at: string
}

export interface OperatingHour {
  id: string
  day_of_week: number // 0=Sun, 1=Mon, ..., 6=Sat
  is_open: boolean
  open_time: string | null  // "HH:mm:ss"
  close_time: string | null // "HH:mm:ss"
  created_at: string
  updated_at: string
}

export interface BugReport {
  id: string
  name: string | null
  phone: string | null
  page: string | null
  description: string
  status: BugReportStatus
  created_at: string
  updated_at: string
}

// ============================================================
// Cart Types (client-side only)
// ============================================================

export interface CartItem {
  menu_id: string
  name: string
  price: number
  image_url: string | null
  quantity: number
  stock_status: StockStatus
}

export interface CartState {
  items: CartItem[]
}

// ============================================================
// API/Form Types
// ============================================================

export interface CreateOrderInput {
  customer_name: string
  customer_phone: string
  notes?: string
  payment_method: PaymentMethod
  items: { menu_id: string; quantity: number }[]
  promotion_id?: string
}

export interface CreateOrderResult {
  order_id: string
  order_number: string
  public_token: string
  total: number
  payment_status: PaymentStatus
}

// ============================================================
// UI Helper Types
// ============================================================

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PESANAN_MASUK: 'Pesanan Masuk',
  DIKONFIRMASI: 'Dikonfirmasi',
  SEDANG_DIPROSES: 'Sedang Diproses',
  SIAP_DIAMBIL: 'Siap Diambil',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  MENUNGGU_PEMBAYARAN: 'Menunggu Pembayaran',
  MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
  DITERIMA: 'Pembayaran Diterima',
  DITOLAK: 'Pembayaran Ditolak',
  COD: 'Bayar di Tempat',
}

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  AVAILABLE: 'Masih Banyak',
  LOW_STOCK: 'Sedikit Lagi',
  OUT_OF_STOCK: 'Habis',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  QRIS: 'QRIS',
  COD: 'Bayar di Tempat (COD)',
}

// Valid order status transitions
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PESANAN_MASUK: ['DIKONFIRMASI', 'DIBATALKAN'],
  DIKONFIRMASI: ['SEDANG_DIPROSES', 'DIBATALKAN'],
  SEDANG_DIPROSES: ['SIAP_DIAMBIL', 'DIBATALKAN'],
  SIAP_DIAMBIL: ['SELESAI'],
  SELESAI: [],
  DIBATALKAN: [],
}

export const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
