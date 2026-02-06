'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import {
  markDone,
  restoreItem,
  archiveItem,
  deleteItem,
  togglePinned,
} from '@/lib/actions/items'
import type { ItemStatus } from '@/app/generated/prisma/enums'

type ItemActionsProps = {
  id: string
  status: ItemStatus
  pinned: boolean
}

export function ItemActions({ id, status, pinned }: ItemActionsProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [pending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isDone = status === 'DONE'
  const isArchived = status === 'ARCHIVED'

  const handleMarkDone = () => {
    startTransition(async () => {
      await markDone(id)
      showToast('Marked as done', {
        type: 'info',
        duration: 5000,
        action: {
          label: 'Undo',
          onClick: () => {
            startTransition(async () => {
              await restoreItem(id)
            })
          },
        },
      })
    })
  }

  const handleRestore = () => {
    startTransition(async () => {
      await restoreItem(id)
    })
  }

  const handleArchive = () => {
    startTransition(async () => {
      await archiveItem(id)
      showToast('Archived', {
        type: 'info',
        duration: 5000,
        action: {
          label: 'Undo',
          onClick: () => {
            startTransition(async () => {
              await restoreItem(id)
              router.push(`/items/${id}`)
            })
          },
        },
      })
      router.push('/items')
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      await deleteItem(id)
      showToast('Moved to trash', {
        type: 'info',
        duration: 5000,
        action: {
          label: 'Undo',
          onClick: async () => {
            const { restoreFromTrash } = await import('@/lib/actions/items')
            startTransition(async () => {
              await restoreFromTrash(id)
              router.push(`/items/${id}`)
            })
          },
        },
      })
      router.push('/items')
    })
  }

  const handleTogglePin = () => {
    startTransition(async () => {
      await togglePinned(id)
    })
  }

  if (showDeleteConfirm) {
    return (
      <div className="space-y-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <p className="text-sm text-red-600">
          Move this item to trash? You can restore it within 30 days.
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowDeleteConfirm(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleDelete}
            disabled={pending}
            className="bg-red-600 hover:bg-red-700"
          >
            {pending ? 'Moving...' : 'Move to trash'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Primary actions */}
      <div className="flex flex-wrap gap-2">
        {!isArchived && (
          <>
            {isDone ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRestore}
                disabled={pending}
              >
                {pending ? 'Restoring...' : 'Mark as Active'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleMarkDone}
                disabled={pending}
              >
                {pending ? 'Updating...' : 'Mark as Done'}
              </Button>
            )}
          </>
        )}

        {isArchived && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRestore}
            disabled={pending}
          >
            {pending ? 'Restoring...' : 'Restore'}
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleTogglePin}
          disabled={pending}
        >
          {pinned ? 'Unpin' : 'Pin'}
        </Button>
      </div>

      {/* Destructive actions */}
      <div className="flex flex-wrap gap-2 border-t border-foreground/10 pt-3">
        {!isArchived && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleArchive}
            disabled={pending}
            className="text-foreground/50 hover:text-foreground"
          >
            Archive
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={pending}
          className="text-red-600 hover:bg-red-500/10 hover:text-red-600"
        >
          Delete
        </Button>
      </div>
    </div>
  )
}
