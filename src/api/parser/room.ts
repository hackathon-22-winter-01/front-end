import { z } from 'zod'
import { Player, playerSchema } from './player'

export interface createRoom {
  id: string
  players: Player[]
  startedAt: string
}

export interface getRoom {
  id: string
  player: Player[]
}

export const roomSchema = z.object({
  id: z.string(),
  players: z.array(playerSchema),
  startedAt: z.string(),
})

export const getRoomSchema = z.object({
  id: z.string(),
  players: z.array(playerSchema),
})
