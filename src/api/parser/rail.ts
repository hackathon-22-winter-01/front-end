import { z } from 'zod'

export interface Rail {
  id: string
  hasBlock: boolean
}

export const railSchema = z.object({
  id: z.string(),
  hasBlock: z.boolean(),
})
