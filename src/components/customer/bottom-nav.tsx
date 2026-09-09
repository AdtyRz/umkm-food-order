'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingCart, Store, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants'
import { useCart } from '@/hooks/use-cart'

const navItems = [
  { href: ROUTES.HOME, label: 'Home', icon: Home },
  { href: ROUTES.CART, label: 'Keranjang', icon: ShoppingCart },
  { href: ROUTES.STORE, label: 'Toko', icon: Store },
  { href: ROUTES.SETTINGS, label: 'Pengaturan', icon: Settings },
] as const

export function CustomerBottomNav() {
  const pathname = usePathname()
  const { itemCount } = useCart()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/30 bg-white/80 backdrop-blur-md safe-area-pb">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === ROUTES.HOME
            ? pathname === href
            : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex min-h-[48px] min-w-[60px] flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1 transition-all',
                isActive
                  ? 'text-[var(--color-primary,#f97316)]'
                  : 'text-gray-400 active:scale-95'
              )}
              aria-label={label}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {href === ROUTES.CART && itemCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary,#f97316)] text-[10px] font-bold text-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </div>
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
