'use client'

import { useState, useEffect } from 'react'
import type { Menu, Category, BusinessSettings, OperatingHour } from '@/types'
import { BestSellerCard } from '@/components/customer/best-seller-card'
import { MenuCard } from '@/components/customer/menu-card'
import { GlassCard } from '@/components/shared/glass-card'
import { calculateStoreStatus } from '@/lib/utils/store-status'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { REALTIME_CHANNELS } from '@/constants'
import { CheckCircle, XCircle, Clock, UtensilsCrossed } from 'lucide-react'

interface CustomerHomeClientProps {
  menus: Menu[]
  categories: Category[]
  settings: BusinessSettings | null
  hours: OperatingHour[]
  bestSellerFood: Menu | null
  bestSellerDrink: Menu | null
}

export function CustomerHomeClient({
  menus: initialMenus,
  categories,
  settings,
  hours: initialHours,
  bestSellerFood: initialFood,
  bestSellerDrink: initialDrink,
}: CustomerHomeClientProps) {
  const [menus, setMenus] = useState<Menu[]>(initialMenus)
  const [hours, setHours] = useState<OperatingHour[]>(initialHours)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const storeStatus = calculateStoreStatus(hours)

  const bestSellerFood =
    menus.find((m) => m.is_best_seller && m.category?.slug === 'makanan') ??
    menus.find((m) => m.category?.slug === 'makanan') ??
    initialFood

  const bestSellerDrink =
    menus.find((m) => m.is_best_seller && m.category?.slug === 'minuman') ??
    menus.find((m) => m.category?.slug === 'minuman') ??
    initialDrink

  // Realtime: menus stock changes
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(REALTIME_CHANNELS.MENUS_PUBLIC)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menus' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setMenus((prev) =>
            prev.map((m) =>
              m.id === (payload.new as Menu).id ? { ...m, ...(payload.new as Menu) } : m
            )
          )
        } else if (payload.eventType === 'INSERT') {
          const newMenu = payload.new as Menu
          if (newMenu.is_active) {
            setMenus((prev) => [...prev, newMenu])
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Realtime: operating hours changes
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(REALTIME_CHANNELS.BUSINESS_SETTINGS)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'operating_hours' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setHours((prev) =>
            prev.map((h) =>
              h.id === (payload.new as OperatingHour).id ? (payload.new as OperatingHour) : h
            )
          )
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredMenus =
    selectedCategory === 'all'
      ? menus
      : menus.filter((m) => m.category_id === selectedCategory)

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/20 bg-white/70 backdrop-blur-md px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">
              {settings?.store_name ?? 'UMKM Kuliner'}
            </h1>
            <p className="text-xs text-gray-500">{settings?.address ?? ''}</p>
          </div>
          {/* Store Status */}
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
              storeStatus.isOpen
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-600'
            )}
          >
            {storeStatus.isOpen ? (
              <CheckCircle className="h-3.5 w-3.5" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            {storeStatus.isOpen ? 'Buka' : 'Tutup'}
          </div>
        </div>
        {/* Store status message */}
        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
          <Clock className="h-3 w-3" />
          {storeStatus.message}
        </p>
      </div>

      <div className="px-4 pb-4">
        {/* Best Sellers */}
        {(bestSellerFood || bestSellerDrink) && (
          <div className="mt-4">
            <h2 className="mb-3 text-sm font-bold text-gray-700">⭐ Best Seller</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {bestSellerFood && (
                <BestSellerCard menu={bestSellerFood} label="Makanan" />
              )}
              {bestSellerDrink && (
                <BestSellerCard menu={bestSellerDrink} label="Minuman" />
              )}
            </div>
          </div>
        )}

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mt-4">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                  selectedCategory === 'all'
                    ? 'bg-[var(--color-primary,#f97316)] text-white shadow-sm'
                    : 'bg-white/70 text-gray-600 border border-gray-200'
                )}
              >
                Semua
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                    selectedCategory === cat.id
                      ? 'bg-[var(--color-primary,#f97316)] text-white shadow-sm'
                      : 'bg-white/70 text-gray-600 border border-gray-200'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Menu List */}
        <div className="mt-4">
          <h2 className="mb-3 text-sm font-bold text-gray-700 flex items-center gap-1.5">
            <UtensilsCrossed className="h-4 w-4" /> Menu
          </h2>
          {filteredMenus.length === 0 ? (
            <GlassCard className="py-10 text-center">
              <UtensilsCrossed className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Belum ada menu tersedia.</p>
            </GlassCard>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredMenus.map((menu) => (
                <MenuCard key={menu.id} menu={menu} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
