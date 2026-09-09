'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Order, OrderStatus } from '@/types'
import { ORDER_STATUS_TRANSITIONS, ORDER_STATUS_LABELS } from '@/types'
import { GlassCard } from '@/components/shared/glass-card'
import { OrderStatusBadge } from '@/components/shared/order-status-badge'
import { PaymentStatusBadge } from '@/components/shared/payment-status-badge'
import { OrderStatusTimeline } from '@/components/shared/order-status-timeline'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ROUTES } from '@/constants'
import { ArrowLeft, Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface AdminOrderDetailClientProps {
  initialOrder: Order
  qrisImageUrl: string | null
  ownerWhatsApp: string | null
}

export function AdminOrderDetailClient({ initialOrder, qrisImageUrl }: AdminOrderDetailClientProps) {
  const [order, setOrder] = useState<Order>(initialOrder)
  const [loading, setLoading] = useState<string | null>(null)

  const allowedTransitions = ORDER_STATUS_TRANSITIONS[order.order_status]

  const updateStatus = async (newStatus: OrderStatus) => {
    setLoading(newStatus)
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setOrder((prev) => ({ ...prev, order_status: newStatus }))
      toast.success(`Status diubah ke ${ORDER_STATUS_LABELS[newStatus]}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah status')
    } finally {
      setLoading(null)
    }
  }

  const verifyPayment = async (action: 'accept' | 'reject') => {
    setLoading(action)
    try {
      const res = await fetch(`/api/orders/${order.id}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setOrder((prev) => ({ ...prev, payment_status: json.payment_status }))
      toast.success(action === 'accept' ? 'Pembayaran diterima' : 'Pembayaran ditolak')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal verifikasi')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col px-4 pt-4 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={ROUTES.ADMIN_ORDERS}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-base font-bold text-gray-900">{order.order_number}</h1>
          <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
        </div>
        <div className="ml-auto">
          <OrderStatusBadge status={order.order_status} />
        </div>
      </div>

      {/* Status Timeline */}
      <GlassCard className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Status</h2>
        <OrderStatusTimeline status={order.order_status} />

        {/* Action Buttons */}
        {allowedTransitions.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {allowedTransitions
              .filter((s) => s !== 'DIBATALKAN')
              .map((nextStatus) => (
                <Button
                  key={nextStatus}
                  onClick={() => updateStatus(nextStatus)}
                  disabled={loading !== null}
                  className="bg-[var(--color-primary,#f97316)] hover:opacity-90 text-white"
                >
                  {loading === nextStatus && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {ORDER_STATUS_LABELS[nextStatus]}
                </Button>
              ))}
            {allowedTransitions.includes('DIBATALKAN') && (
              <Button
                onClick={() => updateStatus('DIBATALKAN')}
                disabled={loading !== null}
                variant="destructive"
              >
                {loading === 'DIBATALKAN' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Batalkan Pesanan
              </Button>
            )}
          </div>
        )}
      </GlassCard>

      {/* Customer Info */}
      <GlassCard className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Pelanggan</h2>
        <p className="text-sm text-gray-800 font-medium">{order.customer_name}</p>
        <p className="text-sm text-gray-500">{order.customer_phone}</p>
        {order.notes && (
          <div className="mt-2 rounded-lg bg-gray-50 p-2">
            <p className="text-xs text-gray-500">Catatan: {order.notes}</p>
          </div>
        )}
      </GlassCard>

      {/* Payment */}
      <GlassCard className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Pembayaran</h2>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Metode</span>
          <span className="text-sm font-medium">{order.payment_method}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Status</span>
          <PaymentStatusBadge status={order.payment_status} />
        </div>

        {/* QRIS Verification */}
        {order.payment_method === 'QRIS' && order.payment_status === 'MENUNGGU_VERIFIKASI' && (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-xs text-orange-600 font-medium">Pelanggan sudah klaim pembayaran.</p>
            <div className="flex gap-2">
              <Button
                onClick={() => verifyPayment('accept')}
                disabled={loading !== null}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {loading === 'accept' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Terima
              </Button>
              <Button
                onClick={() => verifyPayment('reject')}
                disabled={loading !== null}
                variant="destructive"
                className="flex-1"
              >
                {loading === 'reject' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                Tolak
              </Button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Order Items */}
      <GlassCard className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Item Pesanan</h2>
        <div className="flex flex-col gap-2">
          {order.order_items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 flex-1 line-clamp-1">{item.menu_name_snapshot}</span>
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
            <span className="font-bold text-gray-800">Total</span>
            <span className="text-base font-bold text-[var(--color-primary,#f97316)]">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
