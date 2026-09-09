import { createClient } from '@/lib/supabase/server'
import type { Menu, Category, BusinessSettings, OperatingHour } from '@/types'
import { CustomerHomeClient } from '@/components/customer/home-client'

export const revalidate = 0

export default async function HomePage() {
  const supabase = await createClient()

  const [menusRes, categoriesRes, settingsRes, hoursRes] = await Promise.all([
    supabase
      .from('menus')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .order('name'),
    supabase.from('categories').select('*').eq('is_active', true).order('name'),
    supabase.from('business_settings').select('*').limit(1).maybeSingle(),
    supabase.from('operating_hours').select('*').order('day_of_week'),
  ])

  const menus: Menu[] = menusRes.data ?? []
  const categories: Category[] = categoriesRes.data ?? []
  const settings: BusinessSettings | null = settingsRes.data
  const hours: OperatingHour[] = hoursRes.data ?? []

  const bestSellerFood = menus.find(
    (m) => m.is_best_seller && m.category?.slug === 'makanan'
  ) ?? menus.find((m) => m.category?.slug === 'makanan') ?? null

  const bestSellerDrink = menus.find(
    (m) => m.is_best_seller && m.category?.slug === 'minuman'
  ) ?? menus.find((m) => m.category?.slug === 'minuman') ?? null

  return (
    <CustomerHomeClient
      menus={menus}
      categories={categories}
      settings={settings}
      hours={hours}
      bestSellerFood={bestSellerFood}
      bestSellerDrink={bestSellerDrink}
    />
  )
}
