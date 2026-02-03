import { cn } from '@/lib/utils'
import type { ItemType } from '@/app/generated/prisma/enums'

const typeConfig: Record<ItemType, { label: string; className: string }> = {
  IDEA: {
    label: '💡 Idea',
    className: 'bg-yellow-500/10 text-yellow-700',
  },
  RECIPE: {
    label: '🍳 Recipe',
    className: 'bg-orange-500/10 text-orange-700',
  },
  ACTIVITY: {
    label: '🎯 Activity',
    className: 'bg-green-500/10 text-green-700',
  },
  PROJECT: {
    label: '📋 Project',
    className: 'bg-blue-500/10 text-blue-700',
  },
  LOCATION: {
    label: '📍 Location',
    className: 'bg-purple-500/10 text-purple-700',
  },
}

type TypeBadgeProps = {
  type: ItemType
  className?: string
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const config = typeConfig[type]

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
