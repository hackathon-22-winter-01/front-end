import { z } from 'zod'
import { Rail, railSchema } from './rail'

export interface Player {
  id: string
  life: number
}

export const playerSchema = z.object({
  id: z.string(),
  life: z.number(),
})
