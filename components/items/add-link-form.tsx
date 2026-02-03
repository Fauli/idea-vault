'use client'

import { useState, useTransition } from 'react'
import { addLink } from '@/lib/actions/links'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AddLinkFormProps = {
  itemId: string
  className?: string
}

export function AddLinkForm({ itemId, className }: AddLinkFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!url.trim()) {
      setError('URL is required')
      return
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      setError('Please enter a valid URL (include https://)')
      return
    }

    startTransition(async () => {
      try {
        await addLink({
          itemId,
          url: url.trim(),
          title: title.trim() || undefined,
        })
        setUrl('')
        setTitle('')
        setIsOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add link')
      }
    })
  }

  const handleCancel = () => {
    setUrl('')
    setTitle('')
    setError(null)
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-foreground/20 py-3 text-sm text-foreground/50 transition-colors hover:border-foreground/30 hover:text-foreground/70',
          className
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add link
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3', className)}>
      <div>
        <Input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          autoFocus
          disabled={isPending}
        />
      </div>

      <div>
        <Input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Adding...' : 'Add'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
