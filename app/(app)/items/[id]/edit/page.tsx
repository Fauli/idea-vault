import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getItem, getAllTags } from '@/lib/actions/items'
import { ItemForm } from '@/components/items/item-form'

type Params = Promise<{ id: string }>

export default async function EditItemPage({ params }: { params: Params }) {
  const { id } = await params
  const [item, tagSuggestions] = await Promise.all([getItem(id), getAllTags()])

  if (!item) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/items/${id}`}
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
        <h2 className="text-xl font-semibold">Edit Item</h2>
      </div>

      <ItemForm
        mode="edit"
        itemId={id}
        tagSuggestions={tagSuggestions}
        version={item.version}
        defaultValues={{
          title: item.title,
          type: item.type,
          description: item.description,
          priority: item.priority,
          tags: item.tags,
          dueDate: item.dueDate,
          pinned: item.pinned,
          status: item.status,
        }}
      />
    </div>
  )
}
