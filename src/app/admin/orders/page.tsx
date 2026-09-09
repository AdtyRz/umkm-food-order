import { createClient } from '@/lib/supabase/server'
import { AdminOrdersClient } from '@/components/admin/orders-client'
import type { Order } from '@/types'

export const revalidate = 0

export default async function AdminOrdersPage() {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return <AdminOrdersClient initialOrders={(orders ?? []) as Order[]} />
}
