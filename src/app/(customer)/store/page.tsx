import { createClient } from '@/lib/supabase/server'
import type { BusinessSettings, OperatingHour } from '@/types'
import { StorePageClient } from '@/components/customer/store-page-client'

export const revalidate = 0

export default async function StorePage() {
  const supabase = await createClient()

  const [settingsRes, hoursRes] = await Promise.all([
    supabase.from('business_settings').select('*').limit(1).maybeSingle(),
    supabase.from('operating_hours').select('*').order('day_of_week'),
  ])

  return (
    <StorePageClient
      settings={settingsRes.data as BusinessSettings | null}
      hours={hoursRes.data as OperatingHour[] ?? []}
    />
  )
}
