import { cn } from '@/lib/utils'
import type { ItemStatus } from '@/app/generated/prisma/enums'

const statusConfig: Record<ItemStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Active',
    className: 'bg-green-500/10 text-green-700',
  },
  DONE: {
    label: 'Done',
    className: 'bg-blue-500/10 text-blue-700',
  },
  ARCHIVED: {
    label: 'Archived',
    className: 'bg-foreground/10 text-foreground/50',
  },
}

type StatusBadgeProps = {
  status: ItemStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
