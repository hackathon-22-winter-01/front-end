import { z } from 'zod'

export interface Rail {
  id: string
  index: number
}

export const railSchema = z.object({
  id: z.string(),
  index: z.number(),
})
