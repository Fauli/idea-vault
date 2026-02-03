import { z } from 'zod'

export const addLinkSchema = z.object({
  itemId: z.string().uuid(),
  title: z.string().max(200).optional(),
  url: z.string().url('Please enter a valid URL'),
})

export type AddLinkInput = z.infer<typeof addLinkSchema>
