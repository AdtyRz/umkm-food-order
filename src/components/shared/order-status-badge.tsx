import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types'
import { ORDER_STATUS_LABELS } from '@/types'

interface OrderStatusBadgeProps {
  status: OrderStatus
  className?: string
}

const statusStyles: Record<OrderStatus, string> = {
  PESANAN_MASUK: 'bg-blue-100 text-blue-700 border-blue-200',
  DIKONFIRMASI: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  SEDANG_DIPROSES: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  SIAP_DIAMBIL: 'bg-purple-100 text-purple-700 border-purple-200',
  SELESAI: 'bg-green-100 text-green-700 border-green-200',
  DIBATALKAN: 'bg-red-100 text-red-700 border-red-200',
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  )
}
