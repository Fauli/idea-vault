'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createItem, updateItem } from '@/lib/actions/items'
import { itemTypes } from '@/lib/validations/item'
import type { ItemType, ItemStatus } from '@/app/generated/prisma/enums'

const typeLabels: Record<ItemType, string> = {
  IDEA: 'Idea',
  RECIPE: 'Recipe',
  ACTIVITY: 'Activity',
  PROJECT: 'Project',
  LOCATION: 'Location',
}

const priorityLabels = [
  { value: 0, label: 'Low' },
  { value: 1, label: 'Normal' },
  { value: 2, label: 'High' },
  { value: 3, label: 'Urgent' },
]

type ItemFormProps = {
  mode: 'create' | 'edit'
  itemId?: string
  defaultValues?: {
    title?: string
    type?: ItemType
    description?: string | null
    priority?: number
    tags?: string[]
    dueDate?: Date | null
    pinned?: boolean
    status?: ItemStatus
  }
}

export function ItemForm({ mode, itemId, defaultValues = {} }: ItemFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState(defaultValues.title ?? '')
  const [type, setType] = useState<ItemType>(defaultValues.type ?? 'IDEA')
  const [description, setDescription] = useState(defaultValues.description ?? '')
  const [priority, setPriority] = useState(defaultValues.priority ?? 1)
  const [tagsInput, setTagsInput] = useState(defaultValues.tags?.join(', ') ?? '')
  const [dueDate, setDueDate] = useState(
    defaultValues.dueDate
      ? new Date(defaultValues.dueDate).toISOString().split('T')[0]
      : ''
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Parse tags from comma-separated input
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    const data = {
      title: title.trim(),
      type,
      description: description.trim() || undefined,
      priority,
      tags,
      dueDate: dueDate ? new Date(dueDate) : null,
      pinned: defaultValues.pinned ?? false,
    }

    startTransition(async () => {
      try {
        if (mode === 'create') {
          const item = await createItem(data)
          router.push(`/items/${item.id}`)
        } else if (itemId) {
          await updateItem(itemId, data)
          router.push(`/items/${itemId}`)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title <span className="text-red-500">*</span>
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's your idea?"
          required
          disabled={pending}
          autoFocus
        />
      </div>

      {/* Type */}
      <div className="space-y-2">
        <label htmlFor="type" className="text-sm font-medium">
          Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-5 gap-2">
          {itemTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              disabled={pending}
              className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                type === t
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-foreground/20 hover:border-foreground/40'
              }`}
            >
              {typeLabels[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Priority</label>
        <div className="grid grid-cols-4 gap-2">
          {priorityLabels.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              disabled={pending}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                priority === p.value
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-foreground/20 hover:border-foreground/40'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Add some details..."
          disabled={pending}
          className="flex w-full rounded-lg border border-foreground/20 bg-background px-4 py-3 text-base placeholder:text-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-2 disabled:opacity-50"
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label htmlFor="tags" className="text-sm font-medium">
          Tags
        </label>
        <Input
          id="tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="cooking, weekend, fun (comma-separated)"
          disabled={pending}
        />
        <p className="text-xs text-foreground/50">
          Separate tags with commas
        </p>
      </div>

      {/* Due Date */}
      <div className="space-y-2">
        <label htmlFor="dueDate" className="text-sm font-medium">
          Due Date
        </label>
        <Input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={pending}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending
            ? mode === 'create'
              ? 'Creating...'
              : 'Saving...'
            : mode === 'create'
              ? 'Create'
              : 'Save'}
        </Button>
      </div>
    </form>
  )
}
