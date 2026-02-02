import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TypeBadge } from './type-badge'
import { PriorityIndicator } from './priority-indicator'
import { TagList } from './tag-chip'
import type { ItemType, ItemStatus } from '@/app/generated/prisma/enums'

type ItemCardProps = {
  id: string
  title: string
  type: ItemType
  description?: string | null
  priority: number
  status: ItemStatus
  tags: string[]
  pinned: boolean
  dueDate?: Date | null
  className?: string
}

export function ItemCard({
  id,
  title,
  type,
  description,
  priority,
  status,
  tags,
  pinned,
  dueDate,
  className,
}: ItemCardProps) {
  const isDone = status === 'DONE'

  return (
    <Link
      href={`/items/${id}`}
      className={cn(
        'block rounded-lg border border-foreground/10 p-4 transition-all active:scale-[0.98] active:bg-foreground/5',
        isDone && 'opacity-60',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Title row */}
          <div className="flex items-center gap-2">
            {pinned && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 flex-shrink-0 text-foreground/50"
              >
                <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
              </svg>
            )}
            <h3
              className={cn(
                'truncate font-medium',
                isDone && 'line-through'
              )}
            >
              {title}
            </h3>
          </div>

          {/* Description preview */}
          {description && (
            <p className="mt-1 line-clamp-2 text-sm text-foreground/60">
              {description}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-2">
              <TagList tags={tags} max={3} />
            </div>
          )}
        </div>

        {/* Right side: type & priority */}
        <div className="flex flex-col items-end gap-2">
          <TypeBadge type={type} />
          <PriorityIndicator priority={priority} />
        </div>
      </div>

      {/* Due date */}
      {dueDate && (
        <div className="mt-2 flex items-center gap-1 text-xs text-foreground/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-3 w-3"
          >
            <path
              fillRule="evenodd"
              d="M4 1.75a.75.75 0 0 1 1.5 0V3h5V1.75a.75.75 0 0 1 1.5 0V3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2V1.75ZM4.5 6a1 1 0 0 0-1 1v4.5a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-7Z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            {new Date(dueDate).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      )}
    </Link>
  )
}
