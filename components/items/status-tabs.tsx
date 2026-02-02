'use client'

import { useCallback, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { ItemStatus } from '@/app/generated/prisma/enums'

const statusOptions: { value: ItemStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DONE', label: 'Done' },
  { value: 'ARCHIVED', label: 'Archived' },
]

type StatusTabsProps = {
  className?: string
}

export function StatusTabs({ className }: StatusTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentStatus = (searchParams.get('status') as ItemStatus) ?? 'ACTIVE'

  const handleSelect = useCallback(
    (status: ItemStatus) => {
      const params = new URLSearchParams(searchParams.toString())
      if (status === 'ACTIVE') {
        // ACTIVE is default, remove from URL
        params.delete('status')
      } else {
        params.set('status', status)
      }
      startTransition(() => {
        router.push(`/items?${params.toString()}`)
      })
    },
    [router, searchParams]
  )

  return (
    <div
      className={cn(
        'flex border-b border-foreground/10',
        isPending && 'opacity-70',
        className
      )}
    >
      {statusOptions.map((option) => {
        const isSelected = option.value === currentStatus
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={cn(
              'relative flex-1 px-4 py-3 text-sm font-medium transition-colors',
              'min-h-[44px]', // Touch target
              isSelected
                ? 'text-foreground'
                : 'text-foreground/50 hover:text-foreground/70'
            )}
          >
            {option.label}
            {isSelected && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
        )
      })}
    </div>
  )
}
