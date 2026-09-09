'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ShoppingCart, CreditCard, Banknote } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { formatCurrency } from '@/lib/utils'
import { GlassCard } from '@/components/shared/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { checkoutSchema, type CheckoutFormData } from '@/lib/validations'
import { ROUTES } from '@/constants'
import type { CreateOrderResult } from '@/types'
import { cn } from '@/lib/utils'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { payment_method: 'QRIS' },
  })

  const paymentMethod = watch('payment_method')

  if (items.length === 0) {
    router.replace(ROUTES.CART)
    return null
  }

  const onSubmit = async (data: CheckoutFormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          items: items.map((i) => ({ menu_id: i.menu_id, quantity: i.quantity })),
        }),
      })

      const json: { data?: CreateOrderResult; error?: string } = await res.json()

      if (!res.ok || !json.data) {
        throw new Error(json.error ?? 'Gagal membuat pesanan')
      }

      clearCart()
      toast.success('Pesanan berhasil dibuat!')
      router.push(ROUTES.ORDER(json.data.public_token))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col px-4 pt-4">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Customer Info */}
        <GlassCard className="p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Informasi Pemesan</h2>
          <div className="flex flex-col gap-3">
            <div>
              <Label htmlFor="customer_name">Nama *</Label>
              <Input
                id="customer_name"
                {...register('customer_name')}
                placeholder="Masukkan nama kamu"
                className="mt-1"
              />
              {errors.customer_name && (
                <p className="mt-1 text-xs text-red-500">{errors.customer_name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="customer_phone">Nomor WhatsApp *</Label>
              <Input
                id="customer_phone"
                {...register('customer_phone')}
                placeholder="081234567890"
                inputMode="tel"
                className="mt-1"
              />
              {errors.customer_phone && (
                <p className="mt-1 text-xs text-red-500">{errors.customer_phone.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="notes">Catatan (opsional)</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Contoh: tidak pakai sambal"
                rows={2}
                className="mt-1 resize-none"
              />
            </div>
          </div>
        </GlassCard>

        {/* Payment Method */}
        <GlassCard className="p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Metode Pembayaran</h2>
          <div className="flex flex-col gap-2">
            {[
              { value: 'QRIS', label: 'QRIS', desc: 'Scan QR Code untuk bayar', icon: CreditCard },
              { value: 'COD', label: 'Bayar di Tempat (COD)', desc: 'Bayar saat pesanan selesai', icon: Banknote },
            ].map(({ value, label, desc, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setValue('payment_method', value as 'QRIS' | 'COD')}
                className={cn(
                  'flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all',
                  paymentMethod === value
                    ? 'border-[var(--color-primary,#f97316)] bg-orange-50'
                    : 'border-gray-200 bg-white/50'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    paymentMethod === value
                      ? 'bg-[var(--color-primary,#f97316)] text-white'
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <div className="ml-auto">
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full border-2',
                      paymentMethod === value
                        ? 'border-[var(--color-primary,#f97316)] bg-[var(--color-primary,#f97316)]'
                        : 'border-gray-300'
                    )}
                  >
                    {paymentMethod === value && (
                      <div className="h-full w-full rounded-full flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Order Summary */}
        <GlassCard className="p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" /> Ringkasan Pesanan
          </h2>
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div key={item.menu_id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex-1 line-clamp-1">{item.name}</span>
                <span className="text-gray-500 mx-2">×{item.quantity}</span>
                <span className="font-medium text-gray-800 shrink-0">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="mt-2 border-t border-gray-100 pt-2 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">Total</span>
              <span className="text-base font-bold text-[var(--color-primary,#f97316)]">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </GlassCard>

        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full bg-[var(--color-primary,#f97316)] hover:opacity-90 text-white text-base font-semibold"
        >
          {loading ? 'Memproses...' : 'Buat Pesanan'}
        </Button>
      </form>
    </div>
  )
}
