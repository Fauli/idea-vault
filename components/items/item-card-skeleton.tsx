export function ItemCardSkeleton() {
  return (
    <div className="block rounded-lg border border-foreground/10 p-4">
      <div className="flex items-start gap-3">
        {/* Thumbnail skeleton */}
        <div className="h-16 w-16 flex-shrink-0 animate-pulse rounded-lg bg-foreground/10" />

        <div className="min-w-0 flex-1">
          {/* Title skeleton */}
          <div className="h-5 w-3/4 animate-pulse rounded bg-foreground/10" />

          {/* Description skeleton */}
          <div className="mt-2 space-y-1">
            <div className="h-4 w-full animate-pulse rounded bg-foreground/10" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-foreground/10" />
          </div>

          {/* Tags skeleton */}
          <div className="mt-2 flex gap-1">
            <div className="h-5 w-12 animate-pulse rounded-full bg-foreground/10" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-foreground/10" />
          </div>
        </div>

        {/* Right side: type & priority skeleton */}
        <div className="flex flex-col items-end gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-foreground/10" />
          <div className="h-4 w-4 animate-pulse rounded-full bg-foreground/10" />
        </div>
      </div>
    </div>
  )
}

export function ItemListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  )
}
