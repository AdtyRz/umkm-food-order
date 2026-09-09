'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GlassCard } from '@/components/shared/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { UtensilsCrossed, Loader2 } from 'lucide-react'
import { ROUTES } from '@/constants'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push(ROUTES.ADMIN)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary,#f97316)] shadow-lg">
            <UtensilsCrossed className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="mt-1 text-sm text-gray-500">Masuk ke dashboard admin UMKM Kuliner</p>
        </div>

        <GlassCard className="p-6">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@email.com"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-[var(--color-primary,#f97316)] hover:opacity-90 text-white font-semibold"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? 'Memproses...' : 'Login'}
            </Button>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}
