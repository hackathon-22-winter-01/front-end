import { z } from 'zod'

export interface Player {
  id: string
  name: string
  life: number
}

export const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  life: z.number(),
})
