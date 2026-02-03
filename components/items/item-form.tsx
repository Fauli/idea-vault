'use client'

import { useTransition, useState, useEffect, useCallback, useMemo, useRef } from 'react'
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

// Draft storage key and expiry (24 hours)
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000

type DraftData = {
  title: string
  type: ItemType
  description: string
  priority: number
  tags: string[]
  dueDate: string
  savedAt: number
}

function getDraftKey(mode: 'create' | 'edit', itemId?: string): string {
  return mode === 'create' ? 'pocket-ideas-draft-new' : `pocket-ideas-draft-${itemId}`
}

function saveDraft(key: string, data: Omit<DraftData, 'savedAt'>): void {
  try {
    const draft: DraftData = { ...data, savedAt: Date.now() }
    localStorage.setItem(key, JSON.stringify(draft))
  } catch {
    // Ignore localStorage errors (quota, etc.)
  }
}

function loadDraft(key: string): DraftData | null {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return null
    const draft: DraftData = JSON.parse(stored)
    // Check if draft is expired
    if (Date.now() - draft.savedAt > DRAFT_EXPIRY_MS) {
      localStorage.removeItem(key)
      return null
    }
    return draft
  } catch {
    return null
  }
}

function clearDraft(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore
  }
}

type ItemFormProps = {
  mode: 'create' | 'edit'
  itemId?: string
  tagSuggestions?: string[]
  version?: number
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

export function ItemForm({ mode, itemId, tagSuggestions = [], version, defaultValues = {} }: ItemFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [showConflict, setShowConflict] = useState(false)
  const [showDraftPrompt, setShowDraftPrompt] = useState(false)
  const [pendingDraft, setPendingDraft] = useState<DraftData | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const draftKey = getDraftKey(mode, itemId)

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

  // Check for saved draft on mount
  useEffect(() => {
    const draft = loadDraft(draftKey)
    if (draft) {
      // Check if draft has meaningful content that differs from defaults
      const hasContent = draft.title || draft.description || draft.tags.length > 0
      const isDifferent =
        draft.title !== (defaultValues.title ?? '') ||
        draft.description !== (defaultValues.description ?? '') ||
        draft.type !== (defaultValues.type ?? 'IDEA') ||
        draft.priority !== (defaultValues.priority ?? 1) ||
        JSON.stringify(draft.tags) !== JSON.stringify(defaultValues.tags ?? []) ||
        draft.dueDate !== (defaultValues.dueDate ? new Date(defaultValues.dueDate).toISOString().split('T')[0] : '')

      if (hasContent && isDifferent) {
        setPendingDraft(draft)
        setShowDraftPrompt(true)
      } else {
        clearDraft(draftKey)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save draft with debounce
  useEffect(() => {
    if (isSaved || showDraftPrompt) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce save (1 second after last change)
    saveTimeoutRef.current = setTimeout(() => {
      // Only save if there's meaningful content
      if (title || description || tags.length > 0) {
        saveDraft(draftKey, { title, type, description, priority, tags, dueDate })
      }
    }, 1000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [title, type, description, priority, tags, dueDate, draftKey, isSaved, showDraftPrompt])

  const handleRestoreDraft = () => {
    if (pendingDraft) {
      setTitle(pendingDraft.title)
      setType(pendingDraft.type)
      setDescription(pendingDraft.description)
      setPriority(pendingDraft.priority)
      setTags(pendingDraft.tags)
      setDueDate(pendingDraft.dueDate)
      if (pendingDraft.priority !== 1 || pendingDraft.dueDate) {
        setShowMoreOptions(true)
      }
    }
    setShowDraftPrompt(false)
    setPendingDraft(null)
  }

  const handleDiscardDraft = () => {
    clearDraft(draftKey)
    setShowDraftPrompt(false)
    setPendingDraft(null)
  }

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

  const handleSubmit = (e: React.FormEvent, forceUpdate = false) => {
    e.preventDefault()
    setError(null)
    setShowConflict(false)

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
        clearDraft(draftKey) // Clear the draft on save
        if (mode === 'create') {
          const item = await createItem(data)
          router.push(`/items/${item.id}?created=true`)
        } else if (itemId) {
          // Pass version for conflict detection (unless forcing update)
          const result = await updateItem(itemId, data, forceUpdate ? undefined : version)

          if (!result.success && result.conflict) {
            setIsSaved(false)
            setShowConflict(true)
            return
          }

          router.push(`/items/${itemId}?updated=true`)
        }
      } catch (err) {
        setIsSaved(false) // Reset if save failed
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  const handleReload = () => {
    setIsSaved(true) // Prevent unsaved changes warning
    router.refresh()
  }

  const handleForceUpdate = (e: React.FormEvent) => {
    handleSubmit(e, true)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {showConflict && (
        <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5 flex-shrink-0 text-amber-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">
                This item was modified
              </p>
              <p className="mt-1 text-sm text-amber-700">
                Someone else has updated this item since you started editing. What would you like to do?
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleReload}
              disabled={pending}
            >
              Reload latest
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleForceUpdate}
              disabled={pending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {pending ? 'Saving...' : 'Save anyway'}
            </Button>
          </div>
        </div>
      )}

      {showDraftPrompt && pendingDraft && (
        <div className="space-y-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
          <div className="flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5 flex-shrink-0 text-blue-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Unsaved draft found
              </p>
              <p className="mt-1 text-sm text-blue-700">
                You have an unsaved draft from{' '}
                {new Date(pendingDraft.savedAt).toLocaleString(undefined, {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
                . Would you like to restore it?
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleDiscardDraft}
            >
              Discard
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleRestoreDraft}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Restore draft
            </Button>
          </div>
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
                clearDraft(draftKey) // Clear draft when explicitly canceling
                router.back()
              }
            } else {
              clearDraft(draftKey) // Also clear any stale draft
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
