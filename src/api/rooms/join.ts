import { Client } from '..'
import { roomSchema } from '../parser/room'

export const joinRoom =
  (client: Client) => async (roomId: string, playerName: string) => {
    const response = await fetch(`${client.baseUrl}/rooms/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId,
        playerName,
      }),
    })
    const json = await response.json()
    return roomSchema.parse(json)
  }
