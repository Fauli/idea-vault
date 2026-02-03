'use client'

import { useTransition, useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TagInput } from '@/components/items/tag-input'
import { createItem, updateItem } from '@/lib/actions/items'
import { itemTypes } from '@/lib/validations/item'
import { cn } from '@/lib/utils'
import type { ItemType, ItemStatus } from '@/app/generated/prisma/enums'

const typeLabels: Record<ItemType, string> = {
  IDEA: '💡 Idea',
  RECIPE: '🍳 Recipe',
  ACTIVITY: '🎯 Activity',
  PROJECT: '📋 Project',
  LOCATION: '📍 Location',
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
  tagSuggestions?: string[]
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

export function ItemForm({ mode, itemId, tagSuggestions = [], defaultValues = {} }: ItemFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  // Form state
  const [title, setTitle] = useState(defaultValues.title ?? '')
  const [type, setType] = useState<ItemType>(defaultValues.type ?? 'IDEA')
  const [description, setDescription] = useState(defaultValues.description ?? '')
  const [priority, setPriority] = useState(defaultValues.priority ?? 1)
  const [tags, setTags] = useState<string[]>(defaultValues.tags ?? [])
  const [dueDate, setDueDate] = useState(
    defaultValues.dueDate
      ? new Date(defaultValues.dueDate).toISOString().split('T')[0]
      : ''
  )

  // Show more options if editing with non-default values, otherwise collapsed
  const hasAdvancedValues = (defaultValues.priority !== undefined && defaultValues.priority !== 1) || defaultValues.dueDate
  const [showMoreOptions, setShowMoreOptions] = useState(mode === 'edit' && hasAdvancedValues)

  // Track if form has unsaved changes
  const initialValues = useMemo(() => ({
    title: defaultValues.title ?? '',
    type: defaultValues.type ?? 'IDEA',
    description: defaultValues.description ?? '',
    priority: defaultValues.priority ?? 1,
    tags: defaultValues.tags ?? [],
    dueDate: defaultValues.dueDate
      ? new Date(defaultValues.dueDate).toISOString().split('T')[0]
      : '',
  }), [defaultValues.title, defaultValues.type, defaultValues.description, defaultValues.priority, defaultValues.tags, defaultValues.dueDate])

  const hasUnsavedChanges = useCallback(() => {
    if (isSaved) return false
    return (
      title !== initialValues.title ||
      type !== initialValues.type ||
      description !== initialValues.description ||
      priority !== initialValues.priority ||
      JSON.stringify(tags) !== JSON.stringify(initialValues.tags) ||
      dueDate !== initialValues.dueDate
    )
  }, [title, type, description, priority, tags, dueDate, initialValues, isSaved])

  // Warn on browser navigation (refresh, close tab)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

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
        setIsSaved(true) // Mark as saved before navigation
        if (mode === 'create') {
          const item = await createItem(data)
          router.push(`/items/${item.id}?created=true`)
        } else if (itemId) {
          await updateItem(itemId, data)
          router.push(`/items/${itemId}?updated=true`)
        }
      } catch (err) {
        setIsSaved(false) // Reset if save failed
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
        <label className="text-sm font-medium">Tags</label>
        <TagInput
          value={tags}
          onChange={setTags}
          suggestions={tagSuggestions}
          disabled={pending}
          placeholder="Add tags..."
        />
      </div>

      {/* More Options Toggle */}
      <button
        type="button"
        onClick={() => setShowMoreOptions(!showMoreOptions)}
        className="flex w-full items-center justify-between rounded-lg border border-foreground/10 px-4 py-3 text-sm text-foreground/70 transition-colors hover:border-foreground/20 hover:text-foreground"
      >
        <span>More options</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={cn('h-5 w-5 transition-transform', showMoreOptions && 'rotate-180')}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Collapsible: Priority & Due Date */}
      {showMoreOptions && (
        <div className="space-y-4 rounded-lg border border-foreground/10 p-4">
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
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={() => {
            if (hasUnsavedChanges()) {
              if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                setIsSaved(true) // Prevent beforeunload from triggering
                router.back()
              }
            } else {
              router.back()
            }
          }}
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
