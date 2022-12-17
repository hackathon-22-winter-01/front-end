import { Client } from '..'
import { roomSchema } from '../parser/room'

export const createRoom = (client: Client) => async (playerName: string) => {
  const response = await fetch(`${client.baseUrl}/rooms/new`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playerName,
    }),
  })
  const json = await response.json()
  return roomSchema.parse(json)
}
