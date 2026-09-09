import { cn } from '@/lib/utils'
import type { PaymentStatus } from '@/types'
import { PAYMENT_STATUS_LABELS } from '@/types'

interface PaymentStatusBadgeProps {
  status: PaymentStatus
  className?: string
}

const statusStyles: Record<PaymentStatus, string> = {
  MENUNGGU_PEMBAYARAN: 'bg-gray-100 text-gray-700 border-gray-200',
  MENUNGGU_VERIFIKASI: 'bg-orange-100 text-orange-700 border-orange-200',
  DITERIMA: 'bg-green-100 text-green-700 border-green-200',
  DITOLAK: 'bg-red-100 text-red-700 border-red-200',
  COD: 'bg-blue-100 text-blue-700 border-blue-200',
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  )
}
