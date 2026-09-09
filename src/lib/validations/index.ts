import { z } from 'zod'

export const checkoutSchema = z.object({
  customer_name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  customer_phone: z
    .string()
    .min(9, 'Nomor WhatsApp tidak valid')
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, 'Nomor WhatsApp tidak valid'),
  notes: z.string().max(500).optional(),
  payment_method: z.enum(['QRIS', 'COD'] as const),
  promotion_id: z.string().uuid().optional(),
})

export type CheckoutFormData = z.infer<typeof checkoutSchema>

export const menuSchema = z.object({
  name: z.string().min(2, 'Nama menu minimal 2 karakter').max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, 'Harga tidak boleh negatif'),
  category_id: z.string().uuid('Kategori wajib dipilih'),
  stock_status: z.enum(['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK'] as const),
  is_active: z.boolean(),
  is_best_seller: z.boolean(),
})

export type MenuFormData = z.infer<typeof menuSchema>

export const promotionSchema = z
  .object({
    name: z.string().min(2, 'Nama promo minimal 2 karakter').max(100),
    description: z.string().max(500).optional(),
    discount_type: z.enum(['NOMINAL', 'PERCENTAGE'] as const),
    discount_value: z.number().min(0, 'Nilai diskon tidak boleh negatif'),
    minimum_order: z.number().min(0, 'Minimal order tidak boleh negatif'),
    starts_at: z.string(),
    ends_at: z.string(),
    is_active: z.boolean(),
  })
  .refine((d) => new Date(d.starts_at) <= new Date(d.ends_at), {
    message: 'Tanggal mulai tidak boleh setelah tanggal selesai',
    path: ['ends_at'],
  })
  .refine(
    (d) => d.discount_type !== 'PERCENTAGE' || d.discount_value <= 100,
    {
      message: 'Persentase diskon tidak boleh lebih dari 100%',
      path: ['discount_value'],
    }
  )

export type PromotionFormData = z.infer<typeof promotionSchema>

export const businessSettingsSchema = z.object({
  store_name: z.string().min(2, 'Nama toko minimal 2 karakter').max(100),
  store_description: z.string().max(500).optional(),
  address: z.string().max(500).optional(),
  maps_url: z.string().url('URL peta tidak valid').optional().or(z.literal('')),
  owner_whatsapp: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, 'Nomor WhatsApp tidak valid')
    .optional()
    .or(z.literal('')),
  developer_whatsapp: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, 'Nomor WhatsApp tidak valid')
    .optional()
    .or(z.literal('')),
})

export type BusinessSettingsFormData = z.infer<typeof businessSettingsSchema>

export const operatingHourSchema = z.object({
  is_open: z.boolean(),
  open_time: z.string().optional(),
  close_time: z.string().optional(),
})

export type OperatingHourFormData = z.infer<typeof operatingHourSchema>
