import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Order } from '@/types'
import { AdminOrderDetailClient } from '@/components/admin/order-detail-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*), payment:payments(*)')
    .eq('id', id)
    .maybeSingle()

  if (!order) notFound()

  const { data: settings } = await supabase
    .from('business_settings')
    .select('qris_image_url, owner_whatsapp')
    .limit(1)
    .maybeSingle()

  return (
    <AdminOrderDetailClient
      initialOrder={order as Order}
      qrisImageUrl={settings?.qris_image_url ?? null}
      ownerWhatsApp={settings?.owner_whatsapp ?? null}
    />
  )
}
