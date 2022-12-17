import { Client } from '..'
import { roomSchema } from '../parser/room'

export const createRoom = (client: Client) => async (playerName: string) => {
  return await fetch(`${client.baseUrl}/rooms/new`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playerName,
    }),
  })
    .then((res) => res.json())
    .then((data) => roomSchema.parse(data))
}
