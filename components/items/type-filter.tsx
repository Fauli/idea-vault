'use client'

import { useCallback, useTransition, useRef, useState, useEffect } from 'react'
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showRightGradient, setShowRightGradient] = useState(false)
  const [showLeftGradient, setShowLeftGradient] = useState(false)

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

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setShowLeftGradient(scrollLeft > 0)
      setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }, [])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true })
      window.addEventListener('resize', checkScroll)
      return () => {
        el.removeEventListener('scroll', checkScroll)
        window.removeEventListener('resize', checkScroll)
      }
    }
  }, [checkScroll])

  return (
    <div className={cn('relative', className)}>
      {/* Left gradient */}
      {showLeftGradient && (
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-background to-transparent" />
      )}

      {/* Right gradient */}
      {showRightGradient && (
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-background to-transparent" />
      )}

      <div
        ref={scrollRef}
        className={cn(
          'flex gap-2 overflow-x-auto pb-2 scrollbar-none',
          isPending && 'opacity-70'
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
    </div>
  )
}
