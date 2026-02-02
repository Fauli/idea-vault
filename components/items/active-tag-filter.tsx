'use client'

import { useCallback, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

type ActiveTagFilterProps = {
  tag: string
  className?: string
}

export function ActiveTagFilter({ tag, className }: ActiveTagFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleClear = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('tag')
    startTransition(() => {
      router.push(`/items?${params.toString()}`)
    })
  }, [router, searchParams])

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg bg-foreground/5 px-3 py-2',
        isPending && 'opacity-70',
        className
      )}
    >
      <span className="text-sm text-foreground/70">
        Tag: <span className="font-medium text-foreground">{tag}</span>
      </span>
      <button
        type="button"
        onClick={handleClear}
        className="ml-1 rounded-full p-1 text-foreground/50 hover:bg-foreground/10 hover:text-foreground"
        aria-label="Clear tag filter"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}
