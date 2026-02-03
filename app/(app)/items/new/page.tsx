import Link from 'next/link'
import { ItemForm } from '@/components/items/item-form'
import { getAllTags } from '@/lib/actions/items'

export default async function NewItemPage() {
  const tagSuggestions = await getAllTags()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/items"
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-foreground/5 active:bg-foreground/10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </Link>
        <h2 className="text-xl font-semibold">New Item</h2>
      </div>

      <ItemForm mode="create" tagSuggestions={tagSuggestions} />
    </div>
  )
}
