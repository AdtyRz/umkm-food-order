import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Menu, Category } from '@/types'
import { MenuFormClient } from '@/components/admin/menu-form-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditMenuPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [menuRes, catsRes] = await Promise.all([
    supabase.from('menus').select('*').eq('id', id).maybeSingle(),
    supabase.from('categories').select('*').order('name'),
  ])

  if (!menuRes.data) notFound()

  return (
    <MenuFormClient
      menu={menuRes.data as Menu}
      categories={(catsRes.data ?? []) as Category[]}
    />
  )
}
