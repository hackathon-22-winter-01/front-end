import { Client } from '..'
import { getRoomSchema } from '../parser/room'

export const getRoom = (client: Client) => async (roomId: string) => {
  return await fetch(`${client.baseUrl}/rooms/new`, {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      roomId,
    }),
  })
    .then((res) => res.json())
    .then((data) => getRoomSchema.parse(data))
}
