import { createClient } from '@/lib/supabase/server'
import { GlassCard } from '@/components/shared/glass-card'
import { formatCurrency } from '@/lib/utils'
import { BarChart3, TrendingUp, ShoppingBag, CreditCard } from 'lucide-react'

export const revalidate = 0

export default async function AdminReportsPage() {
  const supabase = await createClient()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [todayRes, weekRes, monthRes, topMenusRes, paymentMethodRes] = await Promise.all([
    supabase
      .from('orders')
      .select('total')
      .gte('created_at', todayStart)
      .neq('order_status', 'DIBATALKAN'),
    supabase
      .from('orders')
      .select('total')
      .gte('created_at', weekStart)
      .neq('order_status', 'DIBATALKAN'),
    supabase
      .from('orders')
      .select('total')
      .gte('created_at', monthStart)
      .neq('order_status', 'DIBATALKAN'),
    supabase
      .from('order_items')
      .select('menu_name_snapshot, quantity, subtotal')
      .order('quantity', { ascending: false })
      .limit(5),
    supabase
      .from('orders')
      .select('payment_method, total')
      .neq('order_status', 'DIBATALKAN'),
  ])

  const todayOrders = todayRes.data ?? []
  const weekOrders = weekRes.data ?? []
  const monthOrders = monthRes.data ?? []
  const topMenus = topMenusRes.data ?? []
  const allOrders = paymentMethodRes.data ?? []

  const todayTotal = todayOrders.reduce((s: number, o: { total: number }) => s + Number(o.total), 0)
  const weekTotal = weekOrders.reduce((s: number, o: { total: number }) => s + Number(o.total), 0)
  const monthTotal = monthOrders.reduce((s: number, o: { total: number }) => s + Number(o.total), 0)

  const qrisTotal = allOrders.filter((o: { payment_method: string }) => o.payment_method === 'QRIS').reduce((s: number, o: { total: number }) => s + Number(o.total), 0)
  const codTotal = allOrders.filter((o: { payment_method: string }) => o.payment_method === 'COD').reduce((s: number, o: { total: number }) => s + Number(o.total), 0)
  const qrisCount = allOrders.filter((o: { payment_method: string }) => o.payment_method === 'QRIS').length
  const codCount = allOrders.filter((o: { payment_method: string }) => o.payment_method === 'COD').length

  // Aggregate top menus
  const menuAgg: Record<string, { name: string; qty: number; revenue: number }> = {}
  for (const item of topMenus) {
    const key = item.menu_name_snapshot as string
    if (!menuAgg[key]) menuAgg[key] = { name: key, qty: 0, revenue: 0 }
    menuAgg[key].qty += Number(item.quantity)
    menuAgg[key].revenue += Number(item.subtotal)
  }
  const topMenusSorted = Object.values(menuAgg).sort((a, b) => b.qty - a.qty).slice(0, 5)

  return (
    <div className="flex flex-col px-4 pt-4 gap-4">
      <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <BarChart3 className="h-5 w-5" /> Laporan Penjualan
      </h1>

      {/* Period Stats */}
      <div className="grid grid-cols-1 gap-3">
        {[
          { label: 'Hari Ini', value: todayTotal, count: todayOrders.length, icon: TrendingUp, color: 'text-blue-500' },
          { label: '7 Hari Terakhir', value: weekTotal, count: weekOrders.length, icon: ShoppingBag, color: 'text-green-500' },
          { label: 'Bulan Ini', value: monthTotal, count: monthOrders.length, icon: BarChart3, color: 'text-purple-500' },
        ].map(({ label, value, count, icon: Icon, color }) => (
          <GlassCard key={label} className="p-4 flex items-center gap-4">
            <Icon className={`h-8 w-8 shrink-0 ${color}`} />
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(value)}</p>
              <p className="text-xs text-gray-400">{count} transaksi</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Payment Method Breakdown */}
      <GlassCard className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> Metode Pembayaran
        </h2>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">QRIS ({qrisCount})</span>
            <span className="text-sm font-bold text-gray-800">{formatCurrency(qrisTotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">COD ({codCount})</span>
            <span className="text-sm font-bold text-gray-800">{formatCurrency(codTotal)}</span>
          </div>
          {/* Bar viz */}
          {qrisTotal + codTotal > 0 && (
            <div className="mt-2 flex rounded-full overflow-hidden h-3">
              <div
                className="bg-blue-400"
                style={{ width: `${(qrisTotal / (qrisTotal + codTotal)) * 100}%` }}
                title={`QRIS: ${formatCurrency(qrisTotal)}`}
              />
              <div
                className="bg-green-400 flex-1"
                title={`COD: ${formatCurrency(codTotal)}`}
              />
            </div>
          )}
        </div>
      </GlassCard>

      {/* Top Menus */}
      <GlassCard className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Menu Terlaris</h2>
        {topMenusSorted.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada data penjualan.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {topMenusSorted.map((m, idx) => (
              <div key={m.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-4">{idx + 1}</span>
                  <span className="text-gray-700 line-clamp-1">{m.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-gray-400 text-xs">{m.qty}x</span>
                  <span className="font-bold text-gray-800">{formatCurrency(m.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
