import { createClient } from '@/lib/supabase/server'
import { AdminDashboardClient } from '@/components/admin/dashboard-client'

export const revalidate = 0

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [menuStats, orderStats, recentOrders, salesData] = await Promise.all([
    // Menu stats
    supabase.from('menus').select('id, is_active, stock_status').eq('is_active', true),
    // Order stats
    supabase
      .from('orders')
      .select('total, order_status')
      .neq('order_status', 'DIBATALKAN'),
    // Recent orders
    supabase
      .from('orders')
      .select('id, order_number, customer_name, total, order_status, payment_method, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    // Sales last 7 days
    supabase
      .from('orders')
      .select('total, created_at')
      .neq('order_status', 'DIBATALKAN')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at'),
  ])

  const menus = menuStats.data ?? []
  const orders = orderStats.data ?? []
  const recentOrderList = recentOrders.data ?? []
  const salesRaw = salesData.data ?? []

  const totalMenus = menus.length
  const availableMenus = menus.filter((m) => m.stock_status !== 'OUT_OF_STOCK').length
  const outOfStockMenus = menus.filter((m) => m.stock_status === 'OUT_OF_STOCK').length
  const totalRevenue = orders.reduce((sum: number, o: { total: number }) => sum + Number(o.total), 0)

  // Group sales by day
  const salesByDay: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    salesByDay[key] = 0
  }
  for (const s of salesRaw) {
    const key = (s.created_at as string).slice(0, 10)
    if (key in salesByDay) {
      salesByDay[key] += Number(s.total)
    }
  }

  const chartData = Object.entries(salesByDay).map(([date, total]) => ({
    date: new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    total,
  }))

  return (
    <AdminDashboardClient
      totalMenus={totalMenus}
      availableMenus={availableMenus}
      outOfStockMenus={outOfStockMenus}
      totalRevenue={totalRevenue}
      recentOrders={recentOrderList}
      chartData={chartData}
    />
  )
}
