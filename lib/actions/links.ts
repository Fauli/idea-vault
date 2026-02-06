'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { addLinkSchema, type AddLinkInput } from '@/lib/validations/link'
import { fetchUrlMetadata } from '@/lib/metadata'

/**
 * Add a link to an item
 */
export async function addLink(input: AddLinkInput) {
  await requireAuth()

  const validated = addLinkSchema.parse(input)

  // Verify item exists
  const item = await prisma.item.findUnique({
    where: { id: validated.itemId },
    select: { id: true },
  })

  if (!item) {
    throw new Error('Item not found')
  }

  // Fetch metadata from URL (gracefully fails to empty object)
  const metadata = await fetchUrlMetadata(validated.url)

  const link = await prisma.itemLink.create({
    data: {
      itemId: validated.itemId,
      title: validated.title || metadata.title || null,
      url: validated.url,
      description: metadata.description || null,
      imageUrl: metadata.imageUrl || null,
    },
  })

  // Update item's updatedAt
  await prisma.item.update({
    where: { id: validated.itemId },
    data: { updatedAt: new Date() },
  })

  revalidatePath(`/items/${validated.itemId}`)
  revalidatePath('/items')

  return link
}

/**
 * Remove a link from an item
 */
export async function removeLink(linkId: string) {
  await requireAuth()

  // Get the link to find the itemId for revalidation
  const link = await prisma.itemLink.findUnique({
    where: { id: linkId },
    select: { id: true, itemId: true },
  })

  if (!link) {
    throw new Error('Link not found')
  }

  await prisma.itemLink.delete({
    where: { id: linkId },
  })

  // Update item's updatedAt
  await prisma.item.update({
    where: { id: link.itemId },
    data: { updatedAt: new Date() },
  })

  revalidatePath(`/items/${link.itemId}`)
  revalidatePath('/items')
}

/**
 * Get links for an item
 */
export async function getLinksForItem(itemId: string) {
  await requireAuth()

  const links = await prisma.itemLink.findMany({
    where: { itemId },
    orderBy: { createdAt: 'desc' },
  })

  return links
}
