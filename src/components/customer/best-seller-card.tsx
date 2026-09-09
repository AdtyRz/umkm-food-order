'use client'

import Image from 'next/image'
import { Plus, Star } from 'lucide-react'
import type { Menu } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { StockBadge } from '@/components/shared/stock-badge'
import { useCart } from '@/hooks/use-cart'

interface BestSellerCardProps {
  menu: Menu
  label?: string
}

export function BestSellerCard({ menu, label }: BestSellerCardProps) {
  const { items, addItem } = useCart()
  const cartItem = items.find((i) => i.menu_id === menu.id)
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

  return (
    <div className="relative w-48 shrink-0 overflow-hidden rounded-2xl border border-white/30 bg-gradient-to-br from-white/80 to-white/50 backdrop-blur-md shadow-sm">
      {/* Label */}
      {label && (
        <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-[var(--color-primary,#f97316)] px-2 py-0.5 text-[10px] font-bold text-white">
          <Star className="h-3 w-3 fill-white" />
          {label}
        </div>
      )}

      {/* Image */}
      <div className="relative h-32 w-full overflow-hidden bg-gray-100">
        {menu.image_url ? (
          <Image
            src={menu.image_url}
            alt={menu.name}
            fill
            className="object-cover"
            sizes="192px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-200">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-gray-900">{menu.name}</h3>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm font-bold text-[var(--color-primary,#f97316)]">
            {formatCurrency(menu.price)}
          </span>
          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
              isOutOfStock
                ? 'cursor-not-allowed bg-gray-100 text-gray-300'
                : 'bg-[var(--color-primary,#f97316)] text-white active:scale-90'
            }`}
            aria-label={isOutOfStock ? 'Stok habis' : 'Tambah ke keranjang'}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <StockBadge status={menu.stock_status} className="mt-1" />
      </div>

      {/* Cart indicator */}
      {cartItem && cartItem.quantity > 0 && (
        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">
          {cartItem.quantity}
        </div>
      )}
    </div>
  )
}
