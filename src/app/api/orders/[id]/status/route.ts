import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { OrderStatus } from '@/types'
import { ORDER_STATUS_TRANSITIONS } from '@/types'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { status } = await request.json()

    if (!status) {
      return NextResponse.json({ error: 'Status diperlukan' }, { status: 400 })
    }

    // Get current order
    const { data: order } = await supabase
      .from('orders')
      .select('order_status')
      .eq('id', id)
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }

    const currentStatus = order.order_status as OrderStatus
    const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus]

    if (!allowedTransitions.includes(status as OrderStatus)) {
      return NextResponse.json(
        { error: `Tidak dapat mengubah status dari ${currentStatus} ke ${status}` },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('orders')
      .update({ order_status: status })
      .eq('id', id)

    if (error) {
      console.error('[update-status]', error)
      return NextResponse.json({ error: 'Gagal mengupdate status' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[update-status] error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
