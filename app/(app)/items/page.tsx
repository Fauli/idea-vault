import { getItems, type ItemFilters, type ItemSort } from '@/lib/actions/items'
import { ItemCard } from '@/components/items/item-card'
import { EmptyState } from '@/components/items/empty-state'
import { EmptyFilteredState } from '@/components/items/empty-filtered-state'
import { FilterBar } from '@/components/items/filter-bar'
import type { ItemType, ItemStatus } from '@/app/generated/prisma/enums'

type SearchParams = Promise<{
  q?: string
  type?: string
  status?: string
  sort?: string
  tag?: string
}>

type ItemsPageProps = {
  searchParams: SearchParams
}

// Map URL sort values to backend sort config
function getSortFromParam(sort: string | undefined): ItemSort {
  switch (sort) {
    case 'priority':
      return { field: 'priority', order: 'asc' } // 1 (high) comes before 3 (low)
    case 'dueDate':
      return { field: 'dueDate', order: 'asc' } // Earliest first
    case 'title':
      return { field: 'title', order: 'asc' } // A-Z
    case 'recent':
    default:
      return { field: 'updatedAt', order: 'desc' } // Most recent first
  }
}

export default async function ItemsPage({ searchParams }: ItemsPageProps) {
  const params = await searchParams

  // Build filters from URL params
  const filters: ItemFilters = {}

  if (params.q) {
    filters.search = params.q
  }

  if (params.type && ['IDEA', 'RECIPE', 'ACTIVITY', 'PROJECT', 'LOCATION'].includes(params.type)) {
    filters.type = params.type as ItemType
  }

  if (params.status === 'ALL') {
    // Show all items regardless of status
    filters.status = undefined
  } else if (params.status && ['ACTIVE', 'DONE', 'ARCHIVED'].includes(params.status)) {
    filters.status = params.status as ItemStatus
  }

  if (params.tag) {
    filters.tags = [params.tag]
  }

  const sort = getSortFromParam(params.sort)
  const items = await getItems(filters, sort)

  // Check if any filters are applied (beyond default status)
  const hasFilters = !!(params.q || params.type || params.sort || params.tag)

  // If no items exist at all (first time user), show the empty state
  if (items.length === 0 && !hasFilters && !params.status) {
    // Check if there are any items at all
    const allItems = await getItems({ status: undefined })
    if (allItems.length === 0) {
      return <EmptyState />
    }
  }

  return (
    <div className="space-y-4">
      <FilterBar itemCount={items.length} activeTag={params.tag} />

      {items.length === 0 ? (
        <EmptyFilteredState hasFilters={hasFilters || !!params.status} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              id={item.id}
              title={item.title}
              type={item.type}
              description={item.description}
              priority={item.priority}
              status={item.status}
              tags={item.tags}
              pinned={item.pinned}
              dueDate={item.dueDate}
              thumbnail={item.images[0] ?? null}
              imageCount={item._count.images}
            />
          ))}
        </div>
      )}
    </div>
  )
}
