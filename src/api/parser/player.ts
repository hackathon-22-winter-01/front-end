import { z } from 'zod'

export interface Player {
  id: string
  life: number
}

export const playerSchema = z.object({
  id: z.string(),
  life: z.number(),
})
