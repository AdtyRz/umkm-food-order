'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { Order, BusinessSettings } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { GlassCard } from '@/components/shared/glass-card'
import { OrderStatusTimeline } from '@/components/shared/order-status-timeline'
import { OrderStatusBadge } from '@/components/shared/order-status-badge'
import { PaymentStatusBadge } from '@/components/shared/payment-status-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { buildOrderWhatsApp } from '@/lib/whatsapp'
import { MessageCircle, QrCode, Loader2 } from 'lucide-react'

export default function OrderPage() {
  const params = useParams<{ token: string }>()
  const token = params.token

  const [order, setOrder] = useState<Order | null>(null)
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [qrisUrl, setQrisUrl] = useState<string | null>(null)

  // Fetch order by public token
  useEffect(() => {
    const supabase = createClient()

    async function fetchOrder() {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, menu:menus(image_url)), payment:payments(*)')
        .eq('public_token', token)
        .maybeSingle()

      if (error || !data) {
        setLoading(false)
        return
      }
      setOrder(data as Order)
      setLoading(false)
    }

    async function fetchSettings() {
      const { data } = await supabase
        .from('business_settings')
        .select('*')
        .limit(1)
        .maybeSingle()
      if (data) setSettings(data)
      if (data?.qris_image_url) setQrisUrl(data.qris_image_url)
    }

    fetchOrder()
    fetchSettings()
  }, [token])

  // Realtime: listen to this specific order
  useEffect(() => {
    if (!order?.id) return

    const supabase = createClient()
    const channel = supabase
      .channel(`order-${token}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${order.id}`,
      }, (payload) => {
        const updated = payload.new as Order
        setOrder((prev) => prev ? { ...prev, ...updated } : prev)
        toast.info(`Status pesanan: ${updated.order_status}`)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'payments',
        filter: `order_id=eq.${order.id}`,
      }, (payload) => {
        setOrder((prev) =>
          prev ? { ...prev, payment_status: (payload.new as { status: string }).status as Order['payment_status'] } : prev
        )
        if ((payload.new as { status: string }).status === 'DITERIMA') {
          toast.success('Pembayaran kamu telah diterima!')
        } else if ((payload.new as { status: string }).status === 'DITOLAK') {
          toast.error('Pembayaran ditolak. Silakan hubungi pemilik.')
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [order?.id, token])

  const handlePaid = async () => {
    if (!order) return
    setPaying(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'waiting_verify' }),
      })

      // Direct update since this is customer action
      const supabase = createClient()
      await supabase
        .from('orders')
        .update({ payment_status: 'MENUNGGU_VERIFIKASI' })
        .eq('id', order.id)

      await supabase
        .from('payments')
        .update({ status: 'MENUNGGU_VERIFIKASI' })
        .eq('order_id', order.id)

      setOrder((prev) => prev ? { ...prev, payment_status: 'MENUNGGU_VERIFIKASI' } : prev)
      toast.success('Konfirmasi pembayaran terkirim ke admin!')
    } catch {
      toast.error('Gagal mengirim konfirmasi')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 pt-4 flex flex-col gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <p className="text-gray-500 text-sm">Pesanan tidak ditemukan.</p>
      </div>
    )
  }

  const whatsappUrl = settings?.owner_whatsapp
    ? buildOrderWhatsApp(settings.owner_whatsapp, order.order_number, order.customer_name, order.total)
    : null

  return (
    <div className="flex flex-col px-4 pt-4 gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{order.order_number}</h1>
          <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
        </div>
        <OrderStatusBadge status={order.order_status} />
      </div>

      {/* Status Timeline */}
      <GlassCard className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Status Pesanan</h2>
        <OrderStatusTimeline status={order.order_status} />
      </GlassCard>

      {/* Payment Info */}
      <GlassCard className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Pembayaran</h2>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Metode</span>
          <span className="text-sm font-medium">{order.payment_method === 'QRIS' ? 'QRIS' : 'Bayar di Tempat'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status Bayar</span>
          <PaymentStatusBadge status={order.payment_status} />
        </div>

        {/* QRIS Section */}
        {order.payment_method === 'QRIS' && order.payment_status === 'MENUNGGU_PEMBAYARAN' && (
          <div className="mt-4">
            {qrisUrl ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative h-48 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white p-2">
                  <Image src={qrisUrl} alt="QRIS" fill className="object-contain" />
                </div>
                <p className="text-xs text-gray-500 text-center">Scan QR Code untuk membayar</p>
                <Button
                  onClick={handlePaid}
                  disabled={paying}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {paying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <QrCode className="h-4 w-4 mr-2" />}
                  Saya Sudah Bayar
                </Button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center mt-2">
                Hubungi pemilik untuk info pembayaran QRIS.
              </p>
            )}
          </div>
        )}
      </GlassCard>

      {/* Order Items */}
      <GlassCard className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Detail Pesanan</h2>
        <div className="flex flex-col gap-2">
          {order.order_items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {item.menu?.image_url && (
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                    <Image src={item.menu.image_url} alt={item.menu_name_snapshot} fill className="object-cover" sizes="32px" />
                  </div>
                )}
                <span className="text-gray-700 line-clamp-1">{item.menu_name_snapshot}</span>
              </div>
              <span className="text-gray-500 mx-2">×{item.quantity}</span>
              <span className="font-medium shrink-0">{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
          {(order.discount ?? 0) > 0 && (
            <div className="flex items-center justify-between text-sm text-green-600">
              <span>Diskon</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-800">Total</span>
            <span className="text-base font-bold text-[var(--color-primary,#f97316)]">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>
        {order.notes && (
          <div className="mt-2 rounded-lg bg-gray-50 p-2">
            <p className="text-xs text-gray-500">Catatan: {order.notes}</p>
          </div>
        )}
      </GlassCard>

      {/* WhatsApp */}
      {whatsappUrl && (
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full border-green-300 text-green-600 hover:bg-green-50">
            <MessageCircle className="h-4 w-4 mr-2" />
            Hubungi Pemilik via WhatsApp
          </Button>
        </a>
      )}
    </div>
  )
}
