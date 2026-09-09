'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { Menu, Category, StockStatus } from '@/types'
import { STOCK_STATUS_LABELS } from '@/types'
import { GlassCard } from '@/components/shared/glass-card'
import { StockBadge } from '@/components/shared/stock-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { ROUTES } from '@/constants'
import { toast } from 'sonner'
import { Plus, Star, Eye, EyeOff, UtensilsCrossed } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AdminMenusClient({
  initialMenus,
  categories,
}: {
  initialMenus: Menu[]
  categories: Category[]
}) {
  const [menus, setMenus] = useState<Menu[]>(initialMenus)
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filtered = categoryFilter === 'all'
    ? menus
    : menus.filter((m) => m.category_id === categoryFilter)

  const toggleActive = async (menu: Menu) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('menus')
      .update({ is_active: !menu.is_active })
      .eq('id', menu.id)
    if (error) { toast.error('Gagal mengubah status'); return }
    setMenus((prev) => prev.map((m) => m.id === menu.id ? { ...m, is_active: !m.is_active } : m))
    toast.success(menu.is_active ? 'Menu dinonaktifkan' : 'Menu diaktifkan')
  }

  const updateStockStatus = async (menu: Menu, stock_status: StockStatus) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('menus')
      .update({ stock_status })
      .eq('id', menu.id)
    if (error) { toast.error('Gagal mengubah stok'); return }
    setMenus((prev) => prev.map((m) => m.id === menu.id ? { ...m, stock_status } : m))
    toast.success('Stok diperbarui')
  }

  return (
    <div className="flex flex-col px-4 pt-4 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5" /> Menu
        </h1>
        <Link href={ROUTES.ADMIN_MENUS_NEW}>
          <Button size="sm" className="bg-[var(--color-primary,#f97316)] text-white">
            <Plus className="h-4 w-4 mr-1" /> Tambah
          </Button>
        </Link>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[{ id: 'all', name: 'Semua' }, ...categories].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              categoryFilter === cat.id
                ? 'bg-[var(--color-primary,#f97316)] text-white'
                : 'bg-white/70 text-gray-600 border border-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="py-10 text-center">
          <UtensilsCrossed className="mx-auto h-10 w-10 text-gray-200 mb-2" />
          <p className="text-sm text-gray-400">Belum ada menu tersedia.</p>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((menu) => (
            <GlassCard key={menu.id} className="p-3">
              <div className="flex gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  {menu.image_url ? (
                    <Image src={menu.image_url} alt={menu.name} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                      <UtensilsCrossed className="h-6 w-6" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="line-clamp-1 text-sm font-semibold text-gray-900">{menu.name}</p>
                    {menu.is_best_seller && (
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-400 shrink-0" />
                    )}
                    {!menu.is_active && (
                      <Badge variant="secondary" className="text-[10px]">Nonaktif</Badge>
                    )}
                  </div>
                  <p className="text-sm font-bold text-[var(--color-primary,#f97316)]">
                    {formatCurrency(menu.price)}
                  </p>
                  <StockBadge status={menu.stock_status} />
                </div>
              </div>

              {/* Controls */}
              <div className="mt-3 flex items-center gap-2">
                {/* Stock Status */}
                <Select
                  value={menu.stock_status}
                  onValueChange={(v) => updateStockStatus(menu, v as StockStatus)}
                >
                  <SelectTrigger className="h-8 flex-1 text-xs bg-white/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STOCK_STATUS_LABELS) as StockStatus[]).map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {STOCK_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <button
                  onClick={() => toggleActive(menu)}
                  className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white/70 px-2 text-xs"
                  title={menu.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {menu.is_active
                    ? <Eye className="h-3.5 w-3.5 text-green-500" />
                    : <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                  }
                </button>

                <Link href={ROUTES.ADMIN_MENUS_EDIT(menu.id)}>
                  <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                    Edit
                  </Button>
                </Link>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
