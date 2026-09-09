import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/types'
import { MenuFormClient } from '@/components/admin/menu-form-client'

export default async function NewMenuPage() {
  const supabase = await createClient()
  const { data: cats } = await supabase.from('categories').select('*').order('name')
  return <MenuFormClient categories={(cats ?? []) as Category[]} />
}
