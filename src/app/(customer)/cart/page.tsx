'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { formatCurrency } from '@/lib/utils'
import { GlassCard } from '@/components/shared/glass-card'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants'

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, itemCount } = useCart()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <ShoppingCart className="h-16 w-16 text-gray-200 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">Keranjang Kosong</h2>
        <p className="mt-1 text-sm text-gray-400 text-center">
          Belum ada item di keranjang. Yuk pesan makanan/minuman!
        </p>
        <Link href={ROUTES.HOME}>
          <Button className="mt-6 bg-[var(--color-primary,#f97316)] hover:opacity-90">
            Lihat Menu
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col px-4 pt-4">
      <h1 className="text-xl font-bold text-gray-900 mb-4">
        Keranjang ({itemCount} item)
      </h1>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <GlassCard key={item.menu_id} className="flex items-center gap-3 p-3">
            {/* Image */}
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
              {item.image_url ? (
                <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="64px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300">
                  <ShoppingCart className="h-6 w-6" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="line-clamp-1 text-sm font-semibold text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(item.price)} / item</p>
              <p className="text-sm font-bold text-[var(--color-primary,#f97316)]">
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => removeItem(item.menu_id)}
                className="text-gray-300 hover:text-red-400 transition-colors"
                aria-label="Hapus item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.menu_id, item.quantity - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600 active:scale-90 transition-transform"
                  aria-label="Kurangi"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.menu_id, item.quantity + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary,#f97316)] text-white active:scale-90 transition-transform"
                  aria-label="Tambah"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Total + Checkout */}
      <GlassCard className="sticky bottom-20 mt-4 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">Total</span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(total)}</span>
        </div>
        <Link href={ROUTES.CHECKOUT} className="block">
          <Button className="w-full bg-[var(--color-primary,#f97316)] hover:opacity-90 text-white h-12 text-base font-semibold">
            Checkout
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </GlassCard>
    </div>
  )
}
