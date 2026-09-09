'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { BusinessSettings, OperatingHour } from '@/types'
import { DAY_NAMES } from '@/types'
import { businessSettingsSchema, type BusinessSettingsFormData } from '@/lib/validations'
import { GlassCard } from '@/components/shared/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { STORAGE_BUCKETS, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from '@/constants'
import { formatTime } from '@/lib/utils'
import { Loader2, Upload, Store, Clock, MessageCircle } from 'lucide-react'

interface AdminSettingsClientProps {
  initialSettings: BusinessSettings | null
  initialHours: OperatingHour[]
}

export function AdminSettingsClient({ initialSettings, initialHours }: AdminSettingsClientProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [hours, setHours] = useState<OperatingHour[]>(initialHours)
  const [saving, setSaving] = useState(false)
  const [qrisFile, setQrisFile] = useState<File | null>(null)
  const [qrisPreview, setQrisPreview] = useState<string | null>(initialSettings?.qris_image_url ?? null)

  const { register, handleSubmit, formState: { errors } } = useForm<BusinessSettingsFormData>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: {
      store_name: initialSettings?.store_name ?? '',
      store_description: initialSettings?.store_description ?? '',
      address: initialSettings?.address ?? '',
      maps_url: initialSettings?.maps_url ?? '',
      owner_whatsapp: initialSettings?.owner_whatsapp ?? '',
      developer_whatsapp: initialSettings?.developer_whatsapp ?? '',
    },
  })

  const handleQrisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { toast.error('Format file tidak valid'); return }
    if (file.size > MAX_IMAGE_SIZE_BYTES) { toast.error('Ukuran file terlalu besar'); return }
    setQrisFile(file)
    setQrisPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data: BusinessSettingsFormData) => {
    setSaving(true)
    try {
      const supabase = createClient()
      let qris_image_url = settings?.qris_image_url ?? null

      if (qrisFile) {
        const ext = qrisFile.name.split('.').pop()
        const path = `qris-${Date.now()}.${ext}`
        const { data: uploadData, error } = await supabase.storage
          .from(STORAGE_BUCKETS.QRIS)
          .upload(path, qrisFile, { upsert: true })
        if (error) throw new Error('Gagal upload QRIS: ' + error.message)
        qris_image_url = supabase.storage.from(STORAGE_BUCKETS.QRIS).getPublicUrl(uploadData.path).data.publicUrl
      }

      if (settings?.id) {
        await supabase
          .from('business_settings')
          .update({ ...data, qris_image_url })
          .eq('id', settings.id)
      } else {
        await supabase
          .from('business_settings')
          .insert({ ...data, qris_image_url })
      }

      toast.success('Pengaturan berhasil disimpan')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const updateHour = async (hour: OperatingHour, field: Partial<OperatingHour>) => {
    const supabase = createClient()
    const updated = { ...hour, ...field }
    const { error } = await supabase
      .from('operating_hours')
      .update(field)
      .eq('id', hour.id)
    if (error) { toast.error('Gagal menyimpan jam'); return }
    setHours((prev) => prev.map((h) => h.id === hour.id ? updated : h))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Store Info */}
      <GlassCard className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Store className="h-4 w-4" /> Informasi Toko
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div>
            <Label>Nama Toko *</Label>
            <Input {...register('store_name')} className="mt-1" />
            {errors.store_name && <p className="text-xs text-red-500">{errors.store_name.message}</p>}
          </div>
          <div>
            <Label>Deskripsi</Label>
            <Textarea {...register('store_description')} rows={2} className="mt-1 resize-none" />
          </div>
          <div>
            <Label>Alamat</Label>
            <Textarea {...register('address')} rows={2} className="mt-1 resize-none" />
          </div>
          <div>
            <Label>Link Google Maps</Label>
            <Input {...register('maps_url')} placeholder="https://maps.google.com/..." className="mt-1" />
            {errors.maps_url && <p className="text-xs text-red-500">{errors.maps_url.message}</p>}
          </div>

          <div className="border-t border-gray-100 pt-3">
            <h3 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" /> Nomor WhatsApp
            </h3>
            <div>
              <Label>Pemilik</Label>
              <Input {...register('owner_whatsapp')} placeholder="081234567890" className="mt-1" />
            </div>
            <div className="mt-2">
              <Label>Developer</Label>
              <Input {...register('developer_whatsapp')} placeholder="081234567890" className="mt-1" />
            </div>
          </div>

          {/* QRIS Upload */}
          <div className="border-t border-gray-100 pt-3">
            <Label>QRIS Toko</Label>
            <div className="mt-2 flex items-center gap-3">
              {qrisPreview && (
                <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200">
                  <Image src={qrisPreview} alt="QRIS" fill className="object-contain" />
                </div>
              )}
              <label className="cursor-pointer">
                <span className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600">
                  <Upload className="h-4 w-4" />
                  {qrisPreview ? 'Ganti QRIS' : 'Upload QRIS'}
                </span>
                <input
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES.join(',')}
                  onChange={handleQrisChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <Button type="submit" disabled={saving} className="bg-[var(--color-primary,#f97316)] text-white mt-1">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Simpan Pengaturan
          </Button>
        </form>
      </GlassCard>

      {/* Operating Hours */}
      <GlassCard className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" /> Jam Operasional
        </h2>
        <div className="flex flex-col gap-3">
          {hours.map((hour) => (
            <div key={hour.day_of_week} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{DAY_NAMES[hour.day_of_week]}</span>
                <Switch
                  checked={hour.is_open}
                  onCheckedChange={(v) => updateHour(hour, { is_open: v })}
                />
              </div>
              {hour.is_open && (
                <div className="flex items-center gap-2 ml-1">
                  <Input
                    type="time"
                    defaultValue={hour.open_time ? formatTime(hour.open_time) : ''}
                    onChange={(e) => updateHour(hour, { open_time: e.target.value })}
                    className="h-8 flex-1 text-xs"
                  />
                  <span className="text-xs text-gray-400">–</span>
                  <Input
                    type="time"
                    defaultValue={hour.close_time ? formatTime(hour.close_time) : ''}
                    onChange={(e) => updateHour(hour, { close_time: e.target.value })}
                    className="h-8 flex-1 text-xs"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
