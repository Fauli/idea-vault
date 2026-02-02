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
export async function getItem(id: string) {
  await requireAuth()

  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  })

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
  const where: any = {}

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
    },
  })

  return items
}

/**
 * Update an item
 */
export async function updateItem(id: string, input: UpdateItemInput) {
  await requireAuth()

  const validated = updateItemSchema.parse(input)

  // Remove undefined values
  const data: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(validated)) {
    if (value !== undefined) {
      data[key] = value
    }
  }

  const item = await prisma.item.update({
    where: { id },
    data,
  })

  revalidatePath('/items')
  revalidatePath(`/items/${id}`)
  return item
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
 * Permanently delete an item
 */
export async function deleteItem(id: string) {
  await requireAuth()

  await prisma.item.delete({
    where: { id },
  })

  revalidatePath('/items')
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
