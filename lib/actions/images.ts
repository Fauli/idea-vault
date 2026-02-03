'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { deleteImage as deleteImageFromStorage } from '@/lib/storage'

type AddImageInput = {
  itemId: string
  storageKey: string
  url: string
  contentType: string
  byteSize: number
  width?: number
  height?: number
}

/**
 * Add an image record to an item (after upload)
 */
export async function addImage(input: AddImageInput) {
  await requireAuth()

  // Verify item exists
  const item = await prisma.item.findUnique({
    where: { id: input.itemId },
    select: { id: true },
  })

  if (!item) {
    throw new Error('Item not found')
  }

  const image = await prisma.itemImage.create({
    data: {
      itemId: input.itemId,
      storageKey: input.storageKey,
      url: input.url,
      contentType: input.contentType,
      byteSize: input.byteSize,
      width: input.width,
      height: input.height,
    },
  })

  // Update item's updatedAt
  await prisma.item.update({
    where: { id: input.itemId },
    data: { updatedAt: new Date() },
  })

  revalidatePath(`/items/${input.itemId}`)
  revalidatePath('/items')

  return image
}

/**
 * Remove an image from an item (deletes from storage too)
 */
export async function removeImage(imageId: string) {
  await requireAuth()

  // Get the image to find itemId and storageKey
  const image = await prisma.itemImage.findUnique({
    where: { id: imageId },
    select: { id: true, itemId: true, storageKey: true },
  })

  if (!image) {
    throw new Error('Image not found')
  }

  // Delete from storage
  await deleteImageFromStorage(image.storageKey)

  // Delete from database
  await prisma.itemImage.delete({
    where: { id: imageId },
  })

  // Update item's updatedAt
  await prisma.item.update({
    where: { id: image.itemId },
    data: { updatedAt: new Date() },
  })

  revalidatePath(`/items/${image.itemId}`)
  revalidatePath('/items')
}

/**
 * Get images for an item
 */
export async function getImagesForItem(itemId: string) {
  await requireAuth()

  const images = await prisma.itemImage.findMany({
    where: { itemId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })

  return images
}

/**
 * Reorder images for an item
 * @param imageIds - Array of image IDs in the new order
 */
export async function reorderImages(itemId: string, imageIds: string[]) {
  await requireAuth()

  // Verify all images belong to this item
  const images = await prisma.itemImage.findMany({
    where: { itemId },
    select: { id: true },
  })

  const validIds = new Set(images.map((img) => img.id))
  const allValid = imageIds.every((id) => validIds.has(id))

  if (!allValid || imageIds.length !== images.length) {
    throw new Error('Invalid image IDs')
  }

  // Update sortOrder for each image
  await prisma.$transaction(
    imageIds.map((id, index) =>
      prisma.itemImage.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  )

  // Update item's updatedAt
  await prisma.item.update({
    where: { id: itemId },
    data: { updatedAt: new Date() },
  })

  revalidatePath(`/items/${itemId}`)
  revalidatePath('/items')
}
