import { cn } from '@/lib/utils'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/20 bg-white/70 backdrop-blur-md shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
