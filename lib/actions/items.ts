'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import {
  createItemSchema,
  updateItemSchema,
  type CreateItemInput,
  type UpdateItemInput,
} from '@/lib/validations/item'
import type { ItemType, ItemStatus } from '@/app/generated/prisma/enums'

export type ItemFilters = {
  status?: ItemStatus
  type?: ItemType
  tags?: string[]
  search?: string
  pinned?: boolean
}

export type ItemSortField = 'priority' | 'updatedAt' | 'createdAt' | 'dueDate' | 'title'
export type SortOrder = 'asc' | 'desc'

export type ItemSort = {
  field: ItemSortField
  order: SortOrder
}

/**
 * Create a new item
 */
export async function createItem(input: CreateItemInput) {
  const user = await requireAuth()

  const validated = createItemSchema.parse(input)

  const item = await prisma.item.create({
    data: {
      title: validated.title,
      type: validated.type,
      description: validated.description,
      priority: validated.priority,
      dueDate: validated.dueDate,
      tags: validated.tags,
      pinned: validated.pinned,
      createdById: user.id,
    },
  })

  revalidatePath('/items')
  return item
}

/**
 * Get a single item by ID
 */
export async function getItem(id: string, includeDeleted = false) {
  await requireAuth()

  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      links: {
        orderBy: { createdAt: 'desc' },
      },
      images: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
  })

  // Return null if item is deleted and includeDeleted is false
  if (item && item.deletedAt && !includeDeleted) {
    return null
  }

  return item
}

/**
 * Get items with optional filters and sorting
 */
export async function getItems(
  filters: ItemFilters = {},
  sort: ItemSort = { field: 'updatedAt', order: 'desc' }
) {
  await requireAuth()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    // Always exclude deleted items from normal queries
    deletedAt: null,
  }

  // Status filter (default to ACTIVE, but allow fetching all if explicitly undefined)
  if (filters.status !== undefined) {
    where.status = filters.status
  } else if (!('status' in filters)) {
    // Only default to ACTIVE if status wasn't explicitly passed
    where.status = 'ACTIVE'
  }

  // Type filter
  if (filters.type) {
    where.type = filters.type
  }

  // Tags filter (items that have ALL specified tags)
  if (filters.tags && filters.tags.length > 0) {
    where.tags = { hasEvery: filters.tags }
  }

  // Pinned filter
  if (filters.pinned !== undefined) {
    where.pinned = filters.pinned
  }

  // Search filter (title, description, and tags)
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { tags: { has: filters.search } },
    ]
  }

  const items = await prisma.item.findMany({
    where,
    orderBy: [
      // Pinned items first
      { pinned: 'desc' },
      // Then by specified sort
      { [sort.field]: sort.order },
    ],
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
      images: {
        take: 1,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, url: true },
      },
      links: {
        where: { imageUrl: { not: null } },
        take: 1,
        orderBy: { createdAt: 'asc' },
        select: { id: true, imageUrl: true },
      },
      _count: {
        select: { images: true },
      },
    },
  })

  return items
}

export type UpdateItemResult =
  | { success: true; item: Awaited<ReturnType<typeof prisma.item.update>> }
  | { success: false; conflict: true; currentVersion: number }

/**
 * Update an item with optimistic locking
 * @param id - Item ID
 * @param input - Update data
 * @param expectedVersion - Expected version for conflict detection (optional)
 */
export async function updateItem(
  id: string,
  input: UpdateItemInput,
  expectedVersion?: number
): Promise<UpdateItemResult> {
  await requireAuth()

  const validated = updateItemSchema.parse(input)

  // Check version if provided
  if (expectedVersion !== undefined) {
    const current = await prisma.item.findUnique({
      where: { id },
      select: { version: true },
    })

    if (current && current.version !== expectedVersion) {
      return {
        success: false,
        conflict: true,
        currentVersion: current.version,
      }
    }
  }

  // Remove undefined values
  const data: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(validated)) {
    if (value !== undefined) {
      data[key] = value
    }
  }

  const item = await prisma.item.update({
    where: { id },
    data: {
      ...data,
      version: { increment: 1 },
    },
  })

  revalidatePath('/items')
  revalidatePath(`/items/${id}`)
  return { success: true, item }
}

/**
 * Archive an item (soft delete)
 */
export async function archiveItem(id: string) {
  await requireAuth()

  const item = await prisma.item.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  })

  revalidatePath('/items')
  revalidatePath(`/items/${id}`)
  return item
}

/**
 * Mark an item as done
 */
export async function markDone(id: string) {
  await requireAuth()

  const item = await prisma.item.update({
    where: { id },
    data: { status: 'DONE' },
  })

  revalidatePath('/items')
  revalidatePath(`/items/${id}`)
  return item
}

/**
 * Restore an item to active status
 */
export async function restoreItem(id: string) {
  await requireAuth()

  const item = await prisma.item.update({
    where: { id },
    data: { status: 'ACTIVE' },
  })

  revalidatePath('/items')
  revalidatePath(`/items/${id}`)
  return item
}

/**
 * Soft delete an item (move to trash)
 */
export async function deleteItem(id: string) {
  await requireAuth()

  await prisma.item.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  revalidatePath('/items')
  revalidatePath('/trash')
}

/**
 * Permanently delete an item from trash
 */
export async function permanentlyDeleteItem(id: string) {
  await requireAuth()

  await prisma.item.delete({
    where: { id },
  })

  revalidatePath('/trash')
}

/**
 * Restore an item from trash
 */
export async function restoreFromTrash(id: string) {
  await requireAuth()

  await prisma.item.update({
    where: { id },
    data: { deletedAt: null },
  })

  revalidatePath('/items')
  revalidatePath('/trash')
}

/**
 * Get items in trash (deleted within last 30 days)
 */
export async function getTrashItems() {
  await requireAuth()

  const items = await prisma.item.findMany({
    where: {
      deletedAt: { not: null },
    },
    orderBy: { deletedAt: 'desc' },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
      images: {
        take: 1,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, url: true },
      },
    },
  })

  return items
}

/**
 * Permanently delete all items in trash
 */
export async function emptyTrash() {
  await requireAuth()

  await prisma.item.deleteMany({
    where: {
      deletedAt: { not: null },
    },
  })

  revalidatePath('/trash')
}

/**
 * Toggle pinned status
 */
export async function togglePinned(id: string) {
  await requireAuth()

  const item = await prisma.item.findUnique({
    where: { id },
    select: { pinned: true },
  })

  if (!item) {
    throw new Error('Item not found')
  }

  const updated = await prisma.item.update({
    where: { id },
    data: { pinned: !item.pinned },
  })

  revalidatePath('/items')
  revalidatePath(`/items/${id}`)
  return updated
}

/**
 * Get all unique tags across all items
 */
export async function getAllTags(): Promise<string[]> {
  await requireAuth()

  const items = await prisma.item.findMany({
    where: {
      status: { not: 'ARCHIVED' },
      deletedAt: null,
    },
    select: { tags: true },
  })

  // Flatten and deduplicate tags
  const allTags = items.flatMap((item) => item.tags)
  const uniqueTags = [...new Set(allTags)].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  )

  return uniqueTags
}
