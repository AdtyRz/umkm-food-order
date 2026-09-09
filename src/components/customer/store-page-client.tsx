'use client'

import { useEffect, useState } from 'react'
import type { BusinessSettings, OperatingHour } from '@/types'
import { GlassCard } from '@/components/shared/glass-card'
import { calculateStoreStatus } from '@/lib/utils/store-status'
import { formatTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { DAY_NAMES } from '@/types'
import { MapPin, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react'

interface StorePageClientProps {
  settings: BusinessSettings | null
  hours: OperatingHour[]
}

export function StorePageClient({ settings: initialSettings, hours: initialHours }: StorePageClientProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [hours, setHours] = useState<OperatingHour[]>(initialHours)

  const storeStatus = calculateStoreStatus(hours)

  // Realtime settings changes
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('business-settings-store')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'business_settings' }, (payload) => {
        setSettings((prev) => prev ? { ...prev, ...(payload.new as BusinessSettings) } : (payload.new as BusinessSettings))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'operating_hours' }, (payload) => {
        setHours((prev) =>
          prev.map((h) =>
            h.id === (payload.new as OperatingHour).id ? (payload.new as OperatingHour) : h
          )
        )
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="flex flex-col px-4 pt-4 gap-4">
      <h1 className="text-xl font-bold text-gray-900">Informasi Toko</h1>

      {/* Store Status */}
      <GlassCard
        className={cn(
          'p-4 flex items-center gap-3',
          storeStatus.isOpen ? 'bg-green-50/80 border-green-200/50' : 'bg-red-50/80 border-red-200/50'
        )}
      >
        {storeStatus.isOpen
          ? <CheckCircle className="h-7 w-7 text-green-600 shrink-0" />
          : <XCircle className="h-7 w-7 text-red-500 shrink-0" />
        }
        <div>
          <p className={cn('text-base font-bold', storeStatus.isOpen ? 'text-green-700' : 'text-red-600')}>
            TOKO {storeStatus.isOpen ? 'BUKA' : 'TUTUP'}
          </p>
          <p className="text-sm text-gray-600">{storeStatus.message}</p>
        </div>
      </GlassCard>

      {/* Store Info */}
      <GlassCard className="p-4 flex flex-col gap-3">
        <h2 className="text-base font-bold text-gray-900">
          {settings?.store_name ?? 'Nama Toko Belum Diatur'}
        </h2>
        {settings?.store_description && (
          <p className="text-sm text-gray-600">{settings.store_description}</p>
        )}
        {settings?.address && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-600">{settings.address}</p>
          </div>
        )}
        {settings?.maps_url && (
          <a
            href={settings.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600"
          >
            <ExternalLink className="h-4 w-4" />
            Lihat di Google Maps
          </a>
        )}
      </GlassCard>

      {/* Operating Hours */}
      <GlassCard className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" /> Jam Operasional
        </h2>
        <div className="flex flex-col gap-2">
          {hours.map((h) => {
            const today = new Date().getDay() === h.day_of_week
            return (
              <div
                key={h.day_of_week}
                className={cn(
                  'flex items-center justify-between rounded-lg px-2 py-1.5 text-sm',
                  today ? 'bg-orange-50 font-semibold' : ''
                )}
              >
                <span className={cn('text-gray-700', today ? 'text-[var(--color-primary,#f97316)]' : '')}>
                  {DAY_NAMES[h.day_of_week]}
                  {today && <span className="ml-1 text-xs">(Hari ini)</span>}
                </span>
                {h.is_open && h.open_time && h.close_time ? (
                  <span className="text-gray-600">
                    {formatTime(h.open_time)} – {formatTime(h.close_time)}
                  </span>
                ) : (
                  <span className="text-red-400">Tutup</span>
                )}
              </div>
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}
