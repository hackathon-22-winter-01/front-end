import { z } from 'zod'
import { Rail, railSchema } from './rail'

export interface Player {
  id: string
  mainRail: Rail
  rails: Rail[]
  life: number
}

export const playerSchema = z.object({
  id: z.string(),
  mainRail: railSchema,
  rails: z.array(railSchema),
  life: z.number(),
})
