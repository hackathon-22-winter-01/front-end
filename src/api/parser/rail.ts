import { z } from 'zod'

export interface Rail {
  id: string
  index: number
}

export const railSchema = z.number().nonnegative().max(6)
