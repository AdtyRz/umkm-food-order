'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Promotion } from '@/types'
import { promotionSchema, type PromotionFormData } from '@/lib/validations'
import { GlassCard } from '@/components/shared/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { Plus, Tag, Pencil, Loader2 } from 'lucide-react'

export function AdminPromotionsClient({ initialPromos }: { initialPromos: Promotion[] }) {
  const [promos, setPromos] = useState<Promotion[]>(initialPromos)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Promotion | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register, handleSubmit, reset, watch, setValue, formState: { errors }
  } = useForm<PromotionFormData>({
    resolver: zodResolver(promotionSchema),
    defaultValues: { is_active: true, minimum_order: 0, discount_type: 'NOMINAL' },
  })

  const discountType = watch('discount_type')

  const openNew = () => {
    reset({ is_active: true, minimum_order: 0, discount_type: 'NOMINAL' })
    setEditing(null)
    setOpen(true)
  }

  const openEdit = (promo: Promotion) => {
    reset({
      name: promo.name,
      description: promo.description ?? '',
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      minimum_order: promo.minimum_order,
      starts_at: promo.starts_at.slice(0, 16),
      ends_at: promo.ends_at.slice(0, 16),
      is_active: promo.is_active,
    })
    setEditing(promo)
    setOpen(true)
  }

  const onSubmit = async (data: PromotionFormData) => {
    setLoading(true)
    try {
      const supabase = createClient()
      if (editing) {
        const { data: updated, error } = await supabase
          .from('promotions')
          .update(data)
          .eq('id', editing.id)
          .select()
          .single()
        if (error) throw error
        setPromos((prev) => prev.map((p) => p.id === editing.id ? updated as Promotion : p))
        toast.success('Promo diperbarui')
      } else {
        const { data: created, error } = await supabase
          .from('promotions')
          .insert(data)
          .select()
          .single()
        if (error) throw error
        setPromos((prev) => [created as Promotion, ...prev])
        toast.success('Promo ditambahkan')
      }
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan promo')
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (promo: Promotion) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('promotions').update({ is_active: !promo.is_active }).eq('id', promo.id)
    if (error) { toast.error('Gagal'); return }
    setPromos((prev) => prev.map((p) => p.id === promo.id ? { ...p, is_active: !p.is_active } : p))
  }

  return (
    <div className="flex flex-col px-4 pt-4 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Tag className="h-5 w-5" /> Promo
        </h1>
        <Button size="sm" onClick={openNew} className="bg-[var(--color-primary,#f97316)] text-white">
          <Plus className="h-4 w-4 mr-1" /> Tambah
        </Button>
      </div>

      {promos.length === 0 ? (
        <GlassCard className="py-10 text-center">
          <Tag className="mx-auto h-10 w-10 text-gray-200 mb-2" />
          <p className="text-sm text-gray-400">Belum ada promo aktif.</p>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {promos.map((promo) => (
            <GlassCard key={promo.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{promo.name}</p>
                    <Badge variant={promo.is_active ? 'default' : 'secondary'}>
                      {promo.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                  {promo.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{promo.description}</p>
                  )}
                  <p className="text-sm font-bold text-[var(--color-primary,#f97316)] mt-1">
                    {promo.discount_type === 'PERCENTAGE'
                      ? `${promo.discount_value}% off`
                      : `Hemat ${formatCurrency(promo.discount_value)}`}
                    {promo.minimum_order > 0 && ` (min. ${formatCurrency(promo.minimum_order)})`}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDateShort(promo.starts_at)} — {formatDateShort(promo.ends_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Switch checked={promo.is_active} onCheckedChange={() => toggleActive(promo)} />
                  <button onClick={() => openEdit(promo)}>
                    <Pencil className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Promo' : 'Tambah Promo'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div>
              <Label>Nama *</Label>
              <Input {...register('name')} placeholder="Promo Pembukaan" className="mt-1" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Textarea {...register('description')} rows={2} className="mt-1 resize-none" />
            </div>
            <div>
              <Label>Jenis Diskon</Label>
              <Select
                defaultValue={editing?.discount_type ?? 'NOMINAL'}
                onValueChange={(v) => setValue('discount_type', v as 'NOMINAL' | 'PERCENTAGE')}
              >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOMINAL">Nominal (Rp)</SelectItem>
                  <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nilai Diskon *</Label>
              <Input
                type="number"
                min={0}
                max={discountType === 'PERCENTAGE' ? 100 : undefined}
                {...register('discount_value', { valueAsNumber: true })}
                className="mt-1"
              />
              {errors.discount_value && <p className="text-xs text-red-500">{errors.discount_value.message}</p>}
            </div>
            <div>
              <Label>Minimal Transaksi</Label>
              <Input
                type="number"
                min={0}
                {...register('minimum_order', { valueAsNumber: true })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Mulai</Label>
                <Input type="datetime-local" {...register('starts_at')} className="mt-1 text-xs" />
                {errors.starts_at && <p className="text-xs text-red-500">{errors.starts_at.message}</p>}
              </div>
              <div>
                <Label>Selesai</Label>
                <Input type="datetime-local" {...register('ends_at')} className="mt-1 text-xs" />
                {errors.ends_at && <p className="text-xs text-red-500">{errors.ends_at.message}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Aktif</Label>
              <Switch
                defaultChecked={editing?.is_active ?? true}
                onCheckedChange={(v) => setValue('is_active', v)}
              />
            </div>
            <Button type="submit" disabled={loading} className="bg-[var(--color-primary,#f97316)] text-white">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Simpan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
