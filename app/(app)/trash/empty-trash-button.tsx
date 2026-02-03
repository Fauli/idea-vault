'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { emptyTrash } from '@/lib/actions/items'

export function EmptyTrashButton() {
  const [pending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleEmptyTrash = () => {
    startTransition(async () => {
      await emptyTrash()
      setShowConfirm(false)
    })
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
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
          onClick={handleEmptyTrash}
          disabled={pending}
          className="bg-red-600 hover:bg-red-700"
        >
          {pending ? 'Deleting...' : 'Delete all'}
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setShowConfirm(true)}
      className="text-red-600 hover:bg-red-500/10 hover:text-red-600"
    >
      Empty trash
    </Button>
  )
}
