import Link from 'next/link'
import { cn } from '@/lib/utils'

type TagChipProps = {
  tag: string
  clickable?: boolean
  className?: string
}

export function TagChip({ tag, clickable = true, className }: TagChipProps) {
  const baseStyles = cn(
    'inline-flex items-center rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-foreground/70',
    clickable && 'hover:bg-foreground/10 active:bg-foreground/15 transition-colors',
    className
  )

  if (clickable) {
    return (
      <Link
        href={`/items?tag=${encodeURIComponent(tag)}`}
        className={baseStyles}
      >
        {tag}
      </Link>
    )
  }

  return <span className={baseStyles}>{tag}</span>
}

type TagListProps = {
  tags: string[]
  max?: number
  clickable?: boolean
  className?: string
}

export function TagList({ tags, max = 3, clickable = true, className }: TagListProps) {
  if (tags.length === 0) return null

  const visibleTags = tags.slice(0, max)
  const remaining = tags.length - max

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {visibleTags.map((tag) => (
        <TagChip key={tag} tag={tag} clickable={clickable} />
      ))}
      {remaining > 0 && (
        <span className="text-xs text-foreground/50">+{remaining}</span>
      )}
    </div>
  )
}
