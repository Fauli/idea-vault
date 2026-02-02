'use client'

import { useCallback, useState, useRef, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

type SortOption = {
  value: string
  label: string
}

const sortOptions: SortOption[] = [
  { value: 'recent', label: 'Recent' },
  { value: 'priority', label: 'Priority' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'title', label: 'A-Z' },
]

type SortSelectProps = {
  className?: string
}

export function SortSelect({ className }: SortSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentSort = searchParams.get('sort') ?? 'recent'
  const currentOption = sortOptions.find((o) => o.value === currentSort) ?? sortOptions[0]

  const handleSelect = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === 'recent') {
        // recent is default, remove from URL
        params.delete('sort')
      } else {
        params.set('sort', value)
      }
      setIsOpen(false)
      startTransition(() => {
        router.push(`/items?${params.toString()}`)
      })
    },
    [router, searchParams]
  )

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium',
          'min-h-[44px]', // Touch target
          'bg-foreground/5 text-foreground/70 hover:bg-foreground/10',
          isPending && 'opacity-70'
        )}
      >
        {/* Sort icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
          />
        </svg>
        {currentOption.label}
        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-1 min-w-[140px] rounded-lg border border-foreground/10 bg-background py-1 shadow-lg">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={cn(
                'flex w-full items-center px-4 py-2.5 text-sm',
                'min-h-[44px]', // Touch target
                option.value === currentSort
                  ? 'bg-foreground/5 font-medium text-foreground'
                  : 'text-foreground/70 hover:bg-foreground/5'
              )}
            >
              {option.label}
              {option.value === currentSort && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="ml-auto h-4 w-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
