'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { BusinessSettings } from '@/types'
import { GlassCard } from '@/components/shared/glass-card'
import { useTheme } from '@/hooks/use-theme'
import { THEMES } from '@/constants'
import { cn } from '@/lib/utils'
import { buildOwnerWhatsApp, buildDeveloperWhatsApp } from '@/lib/whatsapp'
import { MessageCircle, Bug, Palette } from 'lucide-react'

export default function SettingsPage() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<BusinessSettings | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('business_settings')
      .select('owner_whatsapp, developer_whatsapp')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(data as BusinessSettings)
      })
  }, [])

  return (
    <div className="flex flex-col px-4 pt-4 gap-4">
      <h1 className="text-xl font-bold text-gray-900">Pengaturan</h1>

      {/* Theme */}
      <GlassCard className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Palette className="h-4 w-4" /> Tema Warna
        </h2>
        <div className="flex gap-3 flex-wrap">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 transition-all min-w-[56px]',
                theme === t.value
                  ? 'border-gray-800 shadow-sm'
                  : 'border-gray-200'
              )}
              aria-label={`Tema ${t.label}`}
            >
              <div
                className="h-8 w-8 rounded-full"
                style={{ backgroundColor: t.color }}
              />
              <span className="text-[10px] text-gray-600">{t.label}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Contact Owner */}
      <GlassCard className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Hubungi Kami</h2>
        {settings?.owner_whatsapp ? (
          <a
            href={buildOwnerWhatsApp(settings.owner_whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 p-3"
          >
            <MessageCircle className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-800">Hubungi Pemilik</p>
              <p className="text-xs text-gray-500">Tanya tentang menu atau pesanan</p>
            </div>
          </a>
        ) : (
          <p className="text-sm text-gray-400">Kontak pemilik belum tersedia.</p>
        )}
      </GlassCard>

      {/* Report Bug */}
      <GlassCard className="p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Lainnya</h2>
        {settings?.developer_whatsapp ? (
          <a
            href={buildDeveloperWhatsApp(settings.developer_whatsapp, pathname)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-200 p-3"
          >
            <Bug className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-800">Laporkan Bug</p>
              <p className="text-xs text-gray-500">Temukan masalah? Laporkan ke developer</p>
            </div>
          </a>
        ) : (
          <p className="text-sm text-gray-400">Kontak developer belum tersedia.</p>
        )}
      </GlassCard>
    </div>
  )
}
