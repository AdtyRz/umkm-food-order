import { createClient } from '@/lib/supabase/server'
import type { BusinessSettings, OperatingHour } from '@/types'
import { AdminSettingsClient } from '@/components/admin/settings-client'
import Link from 'next/link'
import { ROUTES } from '@/constants'
import { Tag, BarChart3 } from 'lucide-react'
import { GlassCard } from '@/components/shared/glass-card'

export const revalidate = 0

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  const [settingsRes, hoursRes] = await Promise.all([
    supabase.from('business_settings').select('*').limit(1).maybeSingle(),
    supabase.from('operating_hours').select('*').order('day_of_week'),
  ])

  return (
    <div className="flex flex-col px-4 pt-4 gap-4">
      <h1 className="text-xl font-bold text-gray-900">Lainnya</h1>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href={ROUTES.ADMIN_PROMOTIONS}>
          <GlassCard className="p-4 flex items-center gap-3">
            <Tag className="h-5 w-5 text-purple-500 shrink-0" />
            <span className="text-sm font-medium text-gray-700">Promo</span>
          </GlassCard>
        </Link>
        <Link href={ROUTES.ADMIN_REPORTS}>
          <GlassCard className="p-4 flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-blue-500 shrink-0" />
            <span className="text-sm font-medium text-gray-700">Laporan</span>
          </GlassCard>
        </Link>
      </div>

      <AdminSettingsClient
        initialSettings={settingsRes.data as BusinessSettings | null}
        initialHours={(hoursRes.data ?? []) as OperatingHour[]}
      />
    </div>
  )
}
