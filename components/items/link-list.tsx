'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { removeLink } from '@/lib/actions/links'
import { cn } from '@/lib/utils'

type Link = {
  id: string
  title: string | null
  url: string
  description: string | null
  imageUrl: string | null
  createdAt: Date
}

type LinkListProps = {
  links: Link[]
  className?: string
}

export function LinkList({ links, className }: LinkListProps) {
  if (links.length === 0) {
    return null
  }

  return (
    <ul className={cn('space-y-3', className)}>
      {links.map((link) => (
        <LinkItem key={link.id} link={link} />
      ))}
    </ul>
  )
}

function LinkItem({ link }: { link: Link }) {
  const [isPending, startTransition] = useTransition()
  const [imageError, setImageError] = useState(false)

  const handleDelete = () => {
    if (!confirm('Remove this link?')) return

    startTransition(async () => {
      await removeLink(link.id)
    })
  }

  // Extract domain for display
  let displayUrl = link.url
  try {
    const url = new URL(link.url)
    displayUrl = url.hostname.replace('www.', '')
  } catch {
    // Invalid URL, use as-is
  }

  const hasRichPreview = (link.imageUrl && !imageError) || link.description

  // Rich preview card
  if (hasRichPreview) {
    return (
      <li
        className={cn(
          'relative overflow-hidden rounded-xl bg-foreground/5',
          isPending && 'opacity-50'
        )}
      >
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {/* Thumbnail image */}
          {link.imageUrl && !imageError && (
            <div className="relative aspect-[2/1] w-full bg-foreground/10">
              <Image
                src={link.imageUrl}
                alt=""
                fill
                className="object-cover"
                onError={() => setImageError(true)}
                unoptimized
              />
            </div>
          )}

          {/* Content */}
          <div className="p-3">
            {/* Title */}
            <div className="line-clamp-2 font-medium text-foreground">
              {link.title || displayUrl}
            </div>

            {/* Description */}
            {link.description && (
              <div className="mt-1 line-clamp-2 text-sm text-foreground/60">
                {link.description}
              </div>
            )}

            {/* Domain with link icon */}
            <div className="mt-2 flex items-center gap-1.5 text-xs text-foreground/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-3.5 w-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                />
              </svg>
              {displayUrl}
            </div>
          </div>
        </a>

        {/* Delete button - overlaid in corner */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white/80 hover:bg-black/70 hover:text-white disabled:opacity-50"
          aria-label="Remove link"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </li>
    )
  }

  // Simple fallback (no metadata)
  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-lg bg-foreground/5 p-3',
        isPending && 'opacity-50'
      )}
    >
      {/* Link icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-5 w-5 shrink-0 text-foreground/50"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
        />
      </svg>

      {/* Link content */}
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-w-0"
      >
        <div className="truncate font-medium text-foreground hover:underline">
          {link.title || displayUrl}
        </div>
        {link.title && (
          <div className="truncate text-sm text-foreground/50">{displayUrl}</div>
        )}
      </a>

      {/* External link indicator */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-4 w-4 shrink-0 text-foreground/30"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
        />
      </svg>

      {/* Delete button */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="rounded-full p-2 text-foreground/40 hover:bg-foreground/10 hover:text-foreground/70 disabled:opacity-50"
        aria-label="Remove link"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
          />
        </svg>
      </button>
    </li>
  )
}
