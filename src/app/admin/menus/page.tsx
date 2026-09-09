import { createClient } from '@/lib/supabase/server'
import type { Menu, Category } from '@/types'
import { AdminMenusClient } from '@/components/admin/menus-client'

export const revalidate = 0

export default async function AdminMenusPage() {
  const supabase = await createClient()

  const [menusRes, catsRes] = await Promise.all([
    supabase
      .from('menus')
      .select('*, category:categories(*)')
      .order('name'),
    supabase.from('categories').select('*').order('name'),
  ])

  return (
    <AdminMenusClient
      initialMenus={(menusRes.data ?? []) as Menu[]}
      categories={(catsRes.data ?? []) as Category[]}
    />
  )
}
