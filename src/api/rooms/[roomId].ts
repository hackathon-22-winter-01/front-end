import { Client } from '..'
import { roomResponseSchema, roomSchema } from '../parser/room'

export const getRoom = (client: Client) => async (roomId: string) => {
  const response = await fetch(`${client.baseUrl}/rooms/${roomId}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  const json = await response.json()
  return roomSchema.parse(json)
}
