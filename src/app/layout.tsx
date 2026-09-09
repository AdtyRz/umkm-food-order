import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { CartProvider } from '@/hooks/use-cart'
import { ThemeProvider } from '@/hooks/use-theme'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UMKM Kuliner',
  description: 'Pesan makanan & minuman favoritmu dengan mudah',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <ThemeProvider>
          <CartProvider>
            <main className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
              {children}
            </main>
            <Toaster position="top-center" richColors />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
