'use server'

import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export type ExportData = {
  exportedAt: string
  version: string
  itemCount: number
  items: Array<{
    id: string
    title: string
    type: string
    description: string | null
    priority: number
    status: string
    dueDate: string | null
    tags: string[]
    pinned: boolean
    createdAt: string
    updatedAt: string
    links: Array<{
      id: string
      title: string | null
      url: string
      createdAt: string
    }>
    images: Array<{
      id: string
      url: string
      contentType: string
      byteSize: number
      width: number | null
      height: number | null
      createdAt: string
    }>
  }>
}

/**
 * Export all items for the current user as JSON
 */
export async function exportAllItems(): Promise<ExportData> {
  await requireAuth()

  const items = await prisma.item.findMany({
    where: {
      deletedAt: null, // Exclude items in trash
    },
    include: {
      links: {
        orderBy: { createdAt: 'asc' },
      },
      images: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    itemCount: items.length,
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      description: item.description,
      priority: item.priority,
      status: item.status,
      dueDate: item.dueDate?.toISOString() ?? null,
      tags: item.tags,
      pinned: item.pinned,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      links: item.links.map((link) => ({
        id: link.id,
        title: link.title,
        url: link.url,
        createdAt: link.createdAt.toISOString(),
      })),
      images: item.images.map((image) => ({
        id: image.id,
        url: image.url,
        contentType: image.contentType,
        byteSize: image.byteSize,
        width: image.width,
        height: image.height,
        createdAt: image.createdAt.toISOString(),
      })),
    })),
  }
}
