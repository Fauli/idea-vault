import { getItems, type ItemFilters, type ItemSort } from '@/lib/actions/items'
import { ItemCard } from '@/components/items/item-card'
import { EmptyState } from '@/components/items/empty-state'
import { EmptyFilteredState } from '@/components/items/empty-filtered-state'

type ItemListProps = {
  filters: ItemFilters
  sort: ItemSort
  hasFilters: boolean
  activeStatus?: string
}

export async function ItemList({ filters, sort, hasFilters, activeStatus }: ItemListProps) {
  const items = await getItems(filters, sort)

  // If no items exist at all (first time user), show the empty state
  if (items.length === 0 && !hasFilters && !activeStatus) {
    // Check if there are any items at all
    const allItems = await getItems({ status: undefined })
    if (allItems.length === 0) {
      return <EmptyState />
    }
  }

  if (items.length === 0) {
    return (
      <EmptyFilteredState
        hasFilters={hasFilters || !!activeStatus}
        searchTerm={filters.search}
      />
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground/60">
        {items.length} item{items.length !== 1 ? 's' : ''}
      </p>
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
  )
}
