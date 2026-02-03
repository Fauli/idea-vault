'use client'

import { useCallback, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { ItemType } from '@/app/generated/prisma/enums'

const typeOptions: { value: ItemType | null; label: string; className: string }[] = [
  {
    value: null,
    label: 'All',
    className: 'bg-foreground/10 text-foreground',
  },
  {
    value: 'IDEA',
    label: '💡 Idea',
    className: 'bg-yellow-500/10 text-yellow-700',
  },
  {
    value: 'RECIPE',
    label: '🍳 Recipe',
    className: 'bg-orange-500/10 text-orange-700',
  },
  {
    value: 'ACTIVITY',
    label: '🎯 Activity',
    className: 'bg-green-500/10 text-green-700',
  },
  {
    value: 'PROJECT',
    label: '📋 Project',
    className: 'bg-blue-500/10 text-blue-700',
  },
  {
    value: 'LOCATION',
    label: '📍 Location',
    className: 'bg-purple-500/10 text-purple-700',
  },
]

type TypeFilterProps = {
  className?: string
}

export function TypeFilter({ className }: TypeFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentType = searchParams.get('type') as ItemType | null

  const handleSelect = useCallback(
    (type: ItemType | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (type) {
        params.set('type', type)
      } else {
        params.delete('type')
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
        'flex gap-2 overflow-x-auto pb-2 scrollbar-none',
        isPending && 'opacity-70',
        className
      )}
    >
      {typeOptions.map((option) => {
        const isSelected = option.value === currentType
        return (
          <button
            key={option.value ?? 'all'}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all',
              'min-h-[44px] min-w-[44px]', // Touch target
              isSelected
                ? cn(option.className, 'ring-2 ring-foreground/20')
                : 'bg-foreground/5 text-foreground/60 hover:bg-foreground/10'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
