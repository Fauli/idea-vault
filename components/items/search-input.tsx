'use client'

import { useCallback, useState, useRef, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type SearchInputProps = {
  className?: string
}

export function SearchInput({ className }: SearchInputProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(searchParams.get('q') ?? '')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const updateSearch = useCallback(
    (newValue: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (newValue) {
        params.set('q', newValue)
      } else {
        params.delete('q')
      }
      startTransition(() => {
        router.push(`/items?${params.toString()}`)
      })
    },
    [router, searchParams]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue)

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new timeout for debounced search
      timeoutRef.current = setTimeout(() => {
        updateSearch(newValue)
      }, 300)
    },
    [updateSearch]
  )

  const handleClear = useCallback(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setValue('')
    updateSearch('')
  }, [updateSearch])

  return (
    <div className={cn('relative', className)}>
      {/* Search icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/50"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
      </svg>

      <Input
        type="search"
        placeholder="Search items..."
        value={value}
        onChange={handleChange}
        className={cn('pl-11 pr-10', isPending && 'opacity-70')}
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full text-foreground/50 hover:bg-foreground/10 hover:text-foreground"
          aria-label="Clear search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
