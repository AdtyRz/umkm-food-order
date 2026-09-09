import { cn } from '@/lib/utils'
import type { StockStatus } from '@/types'
import { STOCK_STATUS_LABELS } from '@/types'

interface StockBadgeProps {
  status: StockStatus
  className?: string
}

const statusStyles: Record<StockStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-700 border-green-200',
  LOW_STOCK: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  OUT_OF_STOCK: 'bg-red-100 text-red-700 border-red-200',
}

export function StockBadge({ status, className }: StockBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      {STOCK_STATUS_LABELS[status]}
    </span>
  )
}
