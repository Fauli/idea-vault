import { Suspense } from 'react'
import { type ItemFilters, type ItemSort } from '@/lib/actions/items'
import { ItemList } from '@/components/items/item-list'
import { ItemListSkeleton } from '@/components/items/item-card-skeleton'
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

  // Check if any filters are applied (beyond default status)
  const hasFilters = !!(params.q || params.type || params.sort || params.tag)

  return (
    <div className="space-y-4">
      <FilterBar activeTag={params.tag} />

      <Suspense fallback={<ItemListSkeleton count={5} />}>
        <ItemList
          filters={filters}
          sort={sort}
          hasFilters={hasFilters}
          activeStatus={params.status}
        />
      </Suspense>
    </div>
  )
}
