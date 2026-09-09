import type { Promotion } from '@/types'

export interface PromoResult {
  discount: number
  promotion_id: string | null
}

export function calculatePromo(subtotal: number, promo: Promotion | null): PromoResult {
  if (!promo) return { discount: 0, promotion_id: null }

  const now = new Date()
  const start = new Date(promo.starts_at)
  const end = new Date(promo.ends_at)

  if (!promo.is_active || now < start || now > end) {
    return { discount: 0, promotion_id: null }
  }

  if (subtotal < promo.minimum_order) {
    return { discount: 0, promotion_id: null }
  }

  let discount = 0
  if (promo.discount_type === 'NOMINAL') {
    discount = Math.min(promo.discount_value, subtotal)
  } else {
    discount = Math.round((subtotal * promo.discount_value) / 100)
  }

  return { discount, promotion_id: promo.id }
}
