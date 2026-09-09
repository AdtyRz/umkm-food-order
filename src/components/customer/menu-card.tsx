'use client'

import Image from 'next/image'
import { Plus, Minus } from 'lucide-react'
import type { Menu } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { StockBadge } from '@/components/shared/stock-badge'
import { GlassCard } from '@/components/shared/glass-card'
import { useCart } from '@/hooks/use-cart'
import { cn } from '@/lib/utils'

interface MenuCardProps {
  menu: Menu
}

export function MenuCard({ menu }: MenuCardProps) {
  const { items, addItem, updateQuantity } = useCart()
  const cartItem = items.find((i) => i.menu_id === menu.id)
  const quantity = cartItem?.quantity ?? 0
  const isOutOfStock = menu.stock_status === 'OUT_OF_STOCK'

  const handleAdd = () => {
    if (isOutOfStock) return
    addItem({
      menu_id: menu.id,
      name: menu.name,
      price: menu.price,
      image_url: menu.image_url,
      stock_status: menu.stock_status,
    })
  }

  const handleDecrease = () => {
    updateQuantity(menu.id, quantity - 1)
  }

  return (
    <GlassCard className="flex gap-3 p-3">
      {/* Image */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {menu.image_url ? (
          <Image
            src={menu.image_url}
            alt={menu.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h3 className="line-clamp-1 text-sm font-semibold text-gray-900">{menu.name}</h3>
          {menu.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{menu.description}</p>
          )}
          <StockBadge status={menu.stock_status} className="mt-1" />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-bold text-[var(--color-primary,#f97316)]">
            {formatCurrency(menu.price)}
          </span>

          {/* Quantity control */}
          {quantity > 0 && !isOutOfStock ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDecrease}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600 active:scale-90 transition-transform"
                aria-label="Kurangi"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-5 text-center text-sm font-semibold">{quantity}</span>
              <button
                onClick={handleAdd}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary,#f97316)] text-white active:scale-90 transition-transform"
                aria-label="Tambah"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full transition-all',
                isOutOfStock
                  ? 'cursor-not-allowed bg-gray-100 text-gray-300'
                  : 'bg-[var(--color-primary,#f97316)] text-white active:scale-90'
              )}
              aria-label={isOutOfStock ? 'Stok habis' : 'Tambah ke keranjang'}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
