import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getItem } from '@/lib/actions/items'
import { Button } from '@/components/ui/button'
import { TypeBadge } from '@/components/items/type-badge'
import { PriorityIndicator } from '@/components/items/priority-indicator'
import { TagList } from '@/components/items/tag-chip'
import { LinkList } from '@/components/items/link-list'
import { AddLinkForm } from '@/components/items/add-link-form'
import { ItemImages } from '@/components/items/item-images'
import { ImageUpload } from '@/components/items/image-upload'
import { ItemActions } from './item-actions'
import { SuccessToast } from '@/components/items/success-toast'

type Params = Promise<{ id: string }>

export default async function ItemDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const item = await getItem(id)

  if (!item) {
    notFound()
  }

  const isDone = item.status === 'DONE'
  const isArchived = item.status === 'ARCHIVED'
  const showHeroImage = ['RECIPE', 'LOCATION'].includes(item.type) && item.images.length > 0

  return (
    <div className="space-y-6">
      <SuccessToast />
      {/* Header with back button */}
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
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <TypeBadge type={item.type} />
            {item.pinned && (
              <span className="text-xs text-foreground/50">Pinned</span>
            )}
            {isArchived && (
              <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs text-foreground/50">
                Archived
              </span>
            )}
          </div>
        </div>
        <Link href={`/items/${id}/edit`}>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </Link>
      </div>

      {/* Title */}
      <h1 className={`text-2xl font-bold ${isDone ? 'line-through opacity-60' : ''}`}>
        {item.title}
      </h1>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/60">
        <div className="flex items-center gap-2">
          <span>Priority:</span>
          <PriorityIndicator priority={item.priority} showLabel />
        </div>
        {item.dueDate && (
          <div className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M4 1.75a.75.75 0 0 1 1.5 0V3h5V1.75a.75.75 0 0 1 1.5 0V3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2V1.75ZM4.5 6a1 1 0 0 0-1 1v4.5a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-7Z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Due{' '}
              {new Date(item.dueDate).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div>
          <TagList tags={item.tags} max={10} />
        </div>
      )}

      {/* Description */}
      {item.description && (
        <div className="rounded-lg bg-foreground/5 p-4">
          <p className="whitespace-pre-wrap text-foreground/80">
            {item.description}
          </p>
        </div>
      )}

      {/* Images */}
      <div className="space-y-3">
        {!showHeroImage && <h2 className="text-sm font-medium text-foreground/70">Photos</h2>}
        <ItemImages images={item.images} itemId={item.id} showHero={showHeroImage} />
        <ImageUpload itemId={item.id} />
      </div>

      {/* Links */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-foreground/70">Links</h2>
        <LinkList links={item.links} />
        <AddLinkForm itemId={item.id} />
      </div>

      {/* Timestamps */}
      <div className="space-y-1 text-xs text-foreground/40">
        <p>
          Created{' '}
          {new Date(item.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          {item.createdBy.name && ` by ${item.createdBy.name}`}
        </p>
        <p>
          Last updated{' '}
          {new Date(item.updatedAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Action buttons */}
      <ItemActions
        id={item.id}
        status={item.status}
        pinned={item.pinned}
      />
    </div>
  )
}
