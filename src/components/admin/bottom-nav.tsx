'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ClipboardList, UtensilsCrossed, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants'

const navItems = [
  { href: ROUTES.ADMIN, label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: ROUTES.ADMIN_ORDERS, label: 'Pesanan', icon: ClipboardList, exact: false },
  { href: ROUTES.ADMIN_MENUS, label: 'Menu', icon: UtensilsCrossed, exact: false },
  { href: ROUTES.ADMIN_SETTINGS, label: 'Lainnya', icon: MoreHorizontal, exact: false },
] as const

export function AdminBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/30 bg-white/80 backdrop-blur-md safe-area-pb">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-h-[48px] min-w-[60px] flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1 transition-all',
                isActive
                  ? 'text-[var(--color-primary,#f97316)]'
                  : 'text-gray-400 active:scale-95'
              )}
              aria-label={label}
            >
              <Icon className="h-5 w-5" />
              <span className={cn('text-[10px] font-medium', isActive ? 'font-semibold' : '')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
