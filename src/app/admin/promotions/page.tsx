import { createClient } from '@/lib/supabase/server'
import type { Promotion } from '@/types'
import { AdminPromotionsClient } from '@/components/admin/promotions-client'

export const revalidate = 0

export default async function AdminPromotionsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('promotions')
    .select('*')
    .order('created_at', { ascending: false })

  return <AdminPromotionsClient initialPromos={(data ?? []) as Promotion[]} />
}
