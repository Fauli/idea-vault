'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { restoreFromTrash, permanentlyDeleteItem } from '@/lib/actions/items'
import type { ItemType } from '@/app/generated/prisma/enums'

const typeEmojis: Record<ItemType, string> = {
  IDEA: '💡',
  RECIPE: '🍳',
  ACTIVITY: '🎯',
  PROJECT: '📋',
  LOCATION: '📍',
}

type TrashItem = {
  id: string
  title: string
  type: ItemType
  deletedAt: Date | null
  images: Array<{ id: string; url: string }>
}

type TrashListProps = {
  items: TrashItem[]
}

export function TrashList({ items }: TrashListProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <TrashItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}

function TrashItemCard({ item }: { item: TrashItem }) {
  const [pending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleRestore = () => {
    startTransition(async () => {
      await restoreFromTrash(item.id)
    })
  }

  const handlePermanentDelete = () => {
    startTransition(async () => {
      await permanentlyDeleteItem(item.id)
    })
  }

  const daysRemaining = item.deletedAt
    ? Math.max(0, 30 - Math.floor((Date.now() - new Date(item.deletedAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 30

  if (showConfirm) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <p className="text-sm text-red-600">
          Permanently delete &ldquo;{item.title}&rdquo;? This cannot be undone.
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowConfirm(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handlePermanentDelete}
            disabled={pending}
            className="bg-red-600 hover:bg-red-700"
          >
            {pending ? 'Deleting...' : 'Delete forever'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-foreground/10 p-4">
      <div className="flex items-start gap-3">
        {item.images[0] ? (
          <img
            src={item.images[0].url}
            alt=""
            className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-xl">
            {typeEmojis[item.type]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-medium truncate">{item.title}</h3>
          <p className="mt-0.5 text-xs text-foreground/50">
            {daysRemaining > 0
              ? `Auto-deletes in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
              : 'Scheduled for deletion'}
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRestore}
          disabled={pending}
        >
          {pending ? 'Restoring...' : 'Restore'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowConfirm(true)}
          disabled={pending}
          className="text-red-600 hover:bg-red-500/10 hover:text-red-600"
        >
          Delete forever
        </Button>
      </div>
    </div>
  )
}
