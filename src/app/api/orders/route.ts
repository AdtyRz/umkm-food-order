import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkoutSchema } from '@/lib/validations'
import { calculatePromo } from '@/lib/utils/promo'
import { normalizeWhatsApp } from '@/lib/utils'
import type { Menu, Promotion, CreateOrderResult } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Data tidak valid' },
        { status: 400 }
      )
    }

    const { customer_name, customer_phone, notes, payment_method, promotion_id } = parsed.data
    const rawItems: { menu_id: string; quantity: number }[] = body.items ?? []

    if (!rawItems.length) {
      return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch menus from DB (server validates, not client)
    const menuIds = rawItems.map((i) => i.menu_id)
    const { data: dbMenus, error: menuError } = await supabase
      .from('menus')
      .select('*')
      .in('id', menuIds)
      .eq('is_active', true)

    if (menuError || !dbMenus) {
      return NextResponse.json({ error: 'Gagal memuat data menu' }, { status: 500 })
    }

    // Validate each item
    for (const item of rawItems) {
      if (!item.menu_id || item.quantity <= 0) {
        return NextResponse.json({ error: 'Quantity tidak valid' }, { status: 400 })
      }
      const menu = dbMenus.find((m: Menu) => m.id === item.menu_id)
      if (!menu) {
        return NextResponse.json({ error: 'Menu tidak tersedia' }, { status: 400 })
      }
      if (menu.stock_status === 'OUT_OF_STOCK') {
        return NextResponse.json(
          { error: `${menu.name} sedang habis` },
          { status: 400 }
        )
      }
    }

    // Calculate subtotal using server-side prices
    const subtotal = rawItems.reduce((sum, item) => {
      const menu = dbMenus.find((m: Menu) => m.id === item.menu_id)!
      return sum + menu.price * item.quantity
    }, 0)

    // Fetch and validate promo
    let promo: Promotion | null = null
    if (promotion_id) {
      const { data: promoData } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', promotion_id)
        .eq('is_active', true)
        .maybeSingle()
      promo = promoData
    }

    const { discount, promotion_id: validPromoId } = calculatePromo(subtotal, promo)
    const total = subtotal - discount

    // Generate order number: ORD-YYYYMMDD-XXXX
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const rand = Math.floor(1000 + Math.random() * 9000)
    const order_number = `ORD-${dateStr}-${rand}`

    // Normalize phone
    const normalizedPhone = normalizeWhatsApp(customer_phone)

    // Determine payment status
    const payment_status = payment_method === 'COD' ? 'COD' : 'MENUNGGU_PEMBAYARAN'

    // Create order (atomic)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number,
        customer_name: customer_name.trim(),
        customer_phone: normalizedPhone,
        notes: notes?.trim() ?? null,
        subtotal,
        discount,
        total,
        payment_method,
        payment_status,
        order_status: 'PESANAN_MASUK',
        promotion_id: validPromoId,
      })
      .select('id, order_number, public_token')
      .single()

    if (orderError || !order) {
      console.error('[create-order] order error:', orderError)
      return NextResponse.json({ error: 'Gagal membuat pesanan' }, { status: 500 })
    }

    // Create order items
    const orderItems = rawItems.map((item) => {
      const menu = dbMenus.find((m: Menu) => m.id === item.menu_id)!
      return {
        order_id: order.id,
        menu_id: item.menu_id,
        menu_name_snapshot: menu.name,
        unit_price: menu.price,
        quantity: item.quantity,
        subtotal: menu.price * item.quantity,
      }
    })

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

    if (itemsError) {
      console.error('[create-order] items error:', itemsError)
      // Rollback order
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Gagal menyimpan item pesanan' }, { status: 500 })
    }

    // Create payment record
    const { error: paymentError } = await supabase.from('payments').insert({
      order_id: order.id,
      method: payment_method,
      status: payment_status,
      paid_at: payment_method === 'COD' ? null : null,
    })

    if (paymentError) {
      console.error('[create-order] payment error:', paymentError)
    }

    const result: CreateOrderResult = {
      order_id: order.id,
      order_number: order.order_number,
      public_token: order.public_token,
      total,
      payment_status,
    }

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (err) {
    console.error('[create-order] unexpected error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
