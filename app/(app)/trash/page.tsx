import { getTrashItems } from '@/lib/actions/items'
import { TrashList } from './trash-list'
import { EmptyTrashButton } from './empty-trash-button'
import Link from 'next/link'

export default async function TrashPage() {
  const items = await getTrashItems()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Trash</h2>
          <p className="mt-1 text-sm text-foreground/60">
            {items.length === 0
              ? 'Trash is empty'
              : `${items.length} item${items.length === 1 ? '' : 's'} in trash`}
          </p>
        </div>
        {items.length > 0 && <EmptyTrashButton />}
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-foreground/10 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6 text-foreground/40"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </div>
          <p className="text-foreground/60">No items in trash</p>
          <Link
            href="/items"
            className="mt-4 inline-block text-sm text-foreground/70 underline underline-offset-2 hover:text-foreground"
          >
            Back to items
          </Link>
        </div>
      ) : (
        <TrashList items={items} />
      )}
    </div>
  )
}
