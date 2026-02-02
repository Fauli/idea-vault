import { cn } from '@/lib/utils'

const priorityConfig: Record<number, { label: string; className: string }> = {
  0: {
    label: 'Low',
    className: 'text-foreground/40',
  },
  1: {
    label: 'Normal',
    className: 'text-foreground/60',
  },
  2: {
    label: 'High',
    className: 'text-orange-600',
  },
  3: {
    label: 'Urgent',
    className: 'text-red-600',
  },
}

type PriorityIndicatorProps = {
  priority: number
  showLabel?: boolean
  className?: string
}

export function PriorityIndicator({
  priority,
  showLabel = false,
  className,
}: PriorityIndicatorProps) {
  const config = priorityConfig[priority] ?? priorityConfig[1]

  // Show filled circles based on priority level
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex gap-0.5">
        {[0, 1, 2, 3].map((level) => (
          <div
            key={level}
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              level <= priority ? config.className : 'bg-foreground/10',
              level <= priority && 'bg-current'
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className={cn('text-xs', config.className)}>{config.label}</span>
      )}
    </div>
  )
}
