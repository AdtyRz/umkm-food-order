import { CustomerBottomNav } from '@/components/customer/bottom-nav'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="mx-auto max-w-lg pb-20">
        {children}
      </div>
      <CustomerBottomNav />
    </>
  )
}
