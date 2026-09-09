export const APP_NAME = 'UMKM Kuliner'
export const APP_DESCRIPTION = 'Pesan makanan & minuman favoritmu dengan mudah'

export const ROUTES = {
  // Customer
  HOME: '/',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDER: (token: string) => `/order/${token}`,
  STORE: '/store',
  SETTINGS: '/settings',
  // Admin
  ADMIN: '/admin',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ORDERS_DETAIL: (id: string) => `/admin/orders/${id}`,
  ADMIN_MENUS: '/admin/menus',
  ADMIN_MENUS_NEW: '/admin/menus/new',
  ADMIN_MENUS_EDIT: (id: string) => `/admin/menus/${id}/edit`,
  ADMIN_PROMOTIONS: '/admin/promotions',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_SETTINGS: '/admin/settings',
  // Auth
  LOGIN: '/auth/login',
} as const

export const SUPABASE_TABLES = {
  PROFILES: 'profiles',
  CATEGORIES: 'categories',
  MENUS: 'menus',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  PAYMENTS: 'payments',
  PROMOTIONS: 'promotions',
  BUSINESS_SETTINGS: 'business_settings',
  OPERATING_HOURS: 'operating_hours',
  BUG_REPORTS: 'bug_reports',
} as const

export const STORAGE_BUCKETS = {
  MENU_IMAGES: 'menu-images',
  QRIS: 'qris',
} as const

export const REALTIME_CHANNELS = {
  ORDERS_ADMIN: 'orders-admin',
  MENUS_PUBLIC: 'menus-public',
  BUSINESS_SETTINGS: 'business-settings',
  ORDER_DETAIL: (token: string) => `order-${token}`,
} as const

export const CART_STORAGE_KEY = 'umkm-cart'
export const THEME_STORAGE_KEY = 'umkm-theme'

export const MAX_IMAGE_SIZE_MB = 5
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const THEMES = [
  { value: 'orange', label: 'Oranye', color: '#f97316' },
  { value: 'red', label: 'Merah', color: '#ef4444' },
  { value: 'green', label: 'Hijau', color: '#22c55e' },
  { value: 'blue', label: 'Biru', color: '#3b82f6' },
  { value: 'purple', label: 'Ungu', color: '#a855f7' },
  { value: 'pink', label: 'Pink', color: '#ec4899' },
] as const

export type ThemeValue = (typeof THEMES)[number]['value']

export const JAKARTA_TIMEZONE = 'Asia/Jakarta'
