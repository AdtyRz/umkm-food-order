'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Order, OrderStatus, PaymentMethod } from '@/types'
import { GlassCard } from '@/components/shared/glass-card'
import { OrderStatusBadge } from '@/components/shared/order-status-badge'
import { PaymentStatusBadge } from '@/components/shared/payment-status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ROUTES } from '@/constants'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ClipboardList, Search } from 'lucide-react'

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'Semua', value: 'all' },
  { label: 'Masuk', value: 'PESANAN_MASUK' },
  { label: 'Aktif', value: 'active' },
  { label: 'Selesai', value: 'SELESAI' },
  { label: 'Batal', value: 'DIBATALKAN' },
]

export function AdminOrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  // Realtime new orders
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('orders-admin-list')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const newOrder = payload.new as Order
        setOrders((prev) => [newOrder, ...prev])
        toast.success(`Pesanan baru: ${newOrder.order_number}`)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((prev) =>
          prev.map((o) => o.id === (payload.new as Order).id ? { ...o, ...(payload.new as Order) } : o)
        )
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === 'all'
      ? true
      : statusFilter === 'active'
      ? ['DIKONFIRMASI', 'SEDANG_DIPROSES', 'SIAP_DIAMBIL'].includes(o.order_status)
      : o.order_status === statusFilter
    const matchSearch = !search
      || o.order_number.toLowerCase().includes(search.toLowerCase())
      || o.customer_name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="flex flex-col px-4 pt-4 gap-4">
      <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <ClipboardList className="h-5 w-5" /> Pesanan
      </h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau nomor order..."
          className="pl-9 bg-white/70"
        />
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
              statusFilter === f.value
                ? 'bg-[var(--color-primary,#f97316)] text-white'
                : 'bg-white/70 text-gray-600 border border-gray-200'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <GlassCard className="py-10 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-gray-200 mb-2" />
          <p className="text-sm text-gray-400">Belum ada pesanan.</p>
          <p className="text-xs text-gray-300">Pesanan baru akan muncul di sini.</p>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((order) => (
            <Link key={order.id} href={ROUTES.ADMIN_ORDERS_DETAIL(order.id)}>
              <GlassCard className="p-3 active:bg-gray-50/80">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{order.order_number}</p>
                    <p className="text-xs text-gray-500">{order.customer_name}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-sm font-bold text-gray-800">{formatCurrency(order.total)}</span>
                    <OrderStatusBadge status={order.order_status} />
                    <PaymentStatusBadge status={order.payment_status} />
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
