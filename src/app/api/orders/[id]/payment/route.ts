import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const { action } = await request.json() // 'accept' | 'reject' | 'paid'

    if (!action) return NextResponse.json({ error: 'Action diperlukan' }, { status: 400 })

    // Get order
    const { data: order } = await supabase
      .from('orders')
      .select('id, payment_method, payment_status')
      .eq('id', id)
      .single()

    if (!order) return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })

    let newPaymentStatus: string
    const updates: Record<string, unknown> = {}

    if (action === 'accept') {
      newPaymentStatus = 'DITERIMA'
      updates.verified_by = user.id
      updates.verified_at = new Date().toISOString()
      updates.paid_at = new Date().toISOString()
    } else if (action === 'reject') {
      newPaymentStatus = 'DITOLAK'
      updates.verified_by = user.id
      updates.verified_at = new Date().toISOString()
    } else if (action === 'paid') {
      newPaymentStatus = 'DITERIMA'
      updates.paid_at = new Date().toISOString()
    } else {
      return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 })
    }

    // Update payment
    await supabase
      .from('payments')
      .update({ status: newPaymentStatus, ...updates })
      .eq('order_id', id)

    // Update order payment_status
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: newPaymentStatus })
      .eq('id', id)

    if (error) {
      console.error('[payment-verify]', error)
      return NextResponse.json({ error: 'Gagal memperbarui pembayaran' }, { status: 500 })
    }

    return NextResponse.json({ success: true, payment_status: newPaymentStatus })
  } catch (err) {
    console.error('[payment-verify] error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
