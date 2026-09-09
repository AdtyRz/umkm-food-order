import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types'
import { ORDER_STATUS_LABELS } from '@/types'
import { CheckCircle2, Circle, XCircle } from 'lucide-react'

const TIMELINE_STEPS: OrderStatus[] = [
  'PESANAN_MASUK',
  'DIKONFIRMASI',
  'SEDANG_DIPROSES',
  'SIAP_DIAMBIL',
  'SELESAI',
]

function getStepState(step: OrderStatus, current: OrderStatus): 'done' | 'active' | 'pending' {
  const idx = TIMELINE_STEPS.indexOf(step)
  const curIdx = TIMELINE_STEPS.indexOf(current)
  if (current === 'DIBATALKAN') return 'pending'
  if (idx < curIdx) return 'done'
  if (idx === curIdx) return 'active'
  return 'pending'
}

interface OrderStatusTimelineProps {
  status: OrderStatus
}

export function OrderStatusTimeline({ status }: OrderStatusTimelineProps) {
  if (status === 'DIBATALKAN') {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 border border-red-200">
        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
        <span className="text-sm font-medium text-red-700">Pesanan Dibatalkan</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      {TIMELINE_STEPS.map((step, idx) => {
        const state = getStepState(step, status)
        return (
          <div key={step} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn('mt-0.5 rounded-full flex items-center justify-center', {
                  'text-green-600': state === 'done',
                  'text-primary': state === 'active',
                  'text-gray-300': state === 'pending',
                })}
              >
                {state === 'done' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : state === 'active' ? (
                  <Circle className="h-5 w-5 fill-current opacity-80" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              {idx < TIMELINE_STEPS.length - 1 && (
                <div
                  className={cn('my-0.5 w-0.5 h-5', {
                    'bg-green-400': state === 'done',
                    'bg-gray-200': state !== 'done',
                  })}
                />
              )}
            </div>
            <span
              className={cn('pb-1 text-sm', {
                'font-medium text-green-700': state === 'done',
                'font-semibold text-gray-900': state === 'active',
                'text-gray-400': state === 'pending',
              })}
            >
              {ORDER_STATUS_LABELS[step]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
