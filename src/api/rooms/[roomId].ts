import { Client } from '..'
import { getRoomSchema } from '../parser/room'

export const getRoom = (client: Client) => async (roomId: string) => {
  return await fetch(`${client.baseUrl}/rooms/${roomId}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((res) => res.json())
    .then((data) => getRoomSchema.parse(data))
}
