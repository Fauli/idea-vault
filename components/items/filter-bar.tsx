'use client'

import { Suspense } from 'react'
import { SearchInput } from './search-input'
import { TypeFilter } from './type-filter'
import { StatusTabs } from './status-tabs'
import { SortSelect } from './sort-select'
import { ActiveTagFilter } from './active-tag-filter'
import { cn } from '@/lib/utils'

type FilterBarProps = {
  activeTag?: string
  className?: string
}

function FilterBarContent({ activeTag, className }: FilterBarProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Search */}
      <SearchInput />

      {/* Active tag filter */}
      {activeTag && <ActiveTagFilter tag={activeTag} />}

      {/* Type chips */}
      <TypeFilter />

      {/* Status tabs */}
      <StatusTabs />

      {/* Sort */}
      <div className="flex items-center justify-end">
        <SortSelect />
      </div>
    </div>
  )
}

export function FilterBar(props: FilterBarProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          {/* Search skeleton */}
          <div className="h-12 animate-pulse rounded-lg bg-foreground/5" />
          {/* Type filter skeleton */}
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-10 w-16 animate-pulse rounded-full bg-foreground/5"
              />
            ))}
          </div>
          {/* Status tabs skeleton */}
          <div className="h-12 animate-pulse rounded-lg bg-foreground/5" />
          {/* Sort skeleton */}
          <div className="flex items-center justify-end">
            <div className="h-10 w-24 animate-pulse rounded-lg bg-foreground/5" />
          </div>
        </div>
      }
    >
      <FilterBarContent {...props} />
    </Suspense>
  )
}
