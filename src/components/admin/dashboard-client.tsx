'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/types'
import { GlassCard } from '@/components/shared/glass-card'
import { OrderStatusBadge } from '@/components/shared/order-status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ROUTES } from '@/constants'
import { toast } from 'sonner'
import {
  UtensilsCrossed, Package, AlertTriangle, TrendingUp,
  ClipboardList, ArrowRight
} from 'lucide-react'

interface ChartDataPoint {
  date: string
  total: number
}

interface AdminDashboardClientProps {
  totalMenus: number
  availableMenus: number
  outOfStockMenus: number
  totalRevenue: number
  recentOrders: Partial<Order>[]
  chartData: ChartDataPoint[]
}

export function AdminDashboardClient({
  totalMenus,
  availableMenus,
  outOfStockMenus,
  totalRevenue,
  recentOrders: initialOrders,
  chartData,
}: AdminDashboardClientProps) {
  const [orders, setOrders] = useState<Partial<Order>[]>(initialOrders)

  // Realtime: new orders
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('orders-admin-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const newOrder = payload.new as Order
        setOrders((prev) => [newOrder, ...prev].slice(0, 10))
        toast.success(`Pesanan baru: ${newOrder.order_number}`, {
          description: `${newOrder.customer_name} — ${formatCurrency(newOrder.total)}`,
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((prev) =>
          prev.map((o) => (o.id === (payload.new as Order).id ? { ...o, ...(payload.new as Order) } : o))
        )
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const maxChartValue = Math.max(...chartData.map((d) => d.total), 1)

  return (
    <div className="flex flex-col px-4 pt-4 gap-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-xs text-gray-400 mt-0.5">Selamat datang, Admin</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <UtensilsCrossed className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-gray-500 font-medium">Total Menu</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalMenus}</p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-green-500" />
            <span className="text-xs text-gray-500 font-medium">Tersedia</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{availableMenus}</p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-xs text-gray-500 font-medium">Stok Habis</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{outOfStockMenus}</p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-gray-500 font-medium">Total Transaksi</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
        </GlassCard>
      </div>

      {/* Sales Chart */}
      <GlassCard className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Penjualan 7 Hari Terakhir</h2>
        <div className="flex items-end gap-1 h-24">
          {chartData.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-sm bg-[var(--color-primary,#f97316)] opacity-80 min-h-[2px]"
                style={{ height: `${(d.total / maxChartValue) * 80}px` }}
                title={formatCurrency(d.total)}
              />
              <span className="text-[9px] text-gray-400 truncate w-full text-center">{d.date}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Recent Orders */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> Pesanan Terbaru
          </h2>
          <Link href={ROUTES.ADMIN_ORDERS} className="text-xs text-[var(--color-primary,#f97316)] font-medium flex items-center gap-1">
            Lihat semua <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="py-6 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">Belum ada pesanan.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={ROUTES.ADMIN_ORDERS_DETAIL(order.id!)}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-white/50 px-3 py-2.5 active:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{order.order_number}</p>
                  <p className="text-xs text-gray-400">{order.customer_name}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-bold text-gray-800">{formatCurrency(order.total ?? 0)}</span>
                  {order.order_status && <OrderStatusBadge status={order.order_status} />}
                </div>
              </Link>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
