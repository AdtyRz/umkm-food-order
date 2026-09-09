import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminBottomNav } from '@/components/admin/bottom-nav'
import { ROUTES } from '@/constants'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(ROUTES.LOGIN)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') redirect(ROUTES.HOME)

  return (
    <>
      <div className="mx-auto max-w-lg pb-20">
        {children}
      </div>
      <AdminBottomNav />
    </>
  )
}
