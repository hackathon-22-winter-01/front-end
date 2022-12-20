import { z } from 'zod'
import { playerSchema } from './player'

export const roomSchema = z.object({
  id: z.string(),
  players: z.array(playerSchema),
  startedAt: z.string(),
})
export type Room = z.infer<typeof roomSchema>

export const getRoomSchema = z.object({
  id: z.string(),
  players: z.array(playerSchema),
})
export type GetRoom = z.infer<typeof getRoomSchema>
