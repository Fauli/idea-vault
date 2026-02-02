import { z } from 'zod'

export const itemTypes = [
  'IDEA',
  'RECIPE',
  'ACTIVITY',
  'PROJECT',
  'LOCATION',
] as const

export const itemStatuses = ['ACTIVE', 'DONE', 'ARCHIVED'] as const

export const createItemSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  type: z.enum(itemTypes, 'Invalid item type'),
  description: z.string().max(5000).optional(),
  priority: z.coerce
    .number()
    .int()
    .min(0, 'Priority must be 0-3')
    .max(3, 'Priority must be 0-3')
    .default(1),
  dueDate: z.coerce.date().optional().nullable(),
  tags: z
    .array(z.string().max(50))
    .max(20, 'Maximum 20 tags allowed')
    .default([]),
  pinned: z.boolean().default(false),
})

export const updateItemSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .optional(),
  type: z.enum(itemTypes, 'Invalid item type').optional(),
  description: z.string().max(5000).optional().nullable(),
  priority: z.coerce
    .number()
    .int()
    .min(0, 'Priority must be 0-3')
    .max(3, 'Priority must be 0-3')
    .optional(),
  status: z.enum(itemStatuses, 'Invalid status').optional(),
  dueDate: z.coerce.date().optional().nullable(),
  tags: z
    .array(z.string().max(50))
    .max(20, 'Maximum 20 tags allowed')
    .optional(),
  pinned: z.boolean().optional(),
})

export type CreateItemInput = z.infer<typeof createItemSchema>
export type UpdateItemInput = z.infer<typeof updateItemSchema>
