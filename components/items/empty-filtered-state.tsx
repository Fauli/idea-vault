import Link from 'next/link'
import { Button } from '@/components/ui/button'

type EmptyFilteredStateProps = {
  hasFilters: boolean
}

export function EmptyFilteredState({ hasFilters }: EmptyFilteredStateProps) {
  if (!hasFilters) {
    // No items at all in this status
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-foreground/5 p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-8 w-8 text-foreground/40"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z"
            />
          </svg>
        </div>
        <p className="mt-4 text-sm text-foreground/60">No items here</p>
        <Link href="/items/new" className="mt-4">
          <Button variant="secondary" size="sm">
            Add item
          </Button>
        </Link>
      </div>
    )
  }

  // Has filters but no matching results
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-foreground/5 p-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-8 w-8 text-foreground/40"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </div>
      <p className="mt-4 text-sm text-foreground/60">No items match your filters</p>
      <Link href="/items" className="mt-4">
        <Button variant="secondary" size="sm">
          Clear filters
        </Button>
      </Link>
    </div>
  )
}
