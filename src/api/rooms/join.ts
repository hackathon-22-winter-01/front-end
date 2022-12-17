import { Client } from '..'
import { roomSchema } from '../parser/room'

export const joinRoom =
  (client: Client) => async (roomId: string, playerName: string) => {
    return await fetch(`${client.baseUrl}/rooms/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId,
        playerName,
      }),
    })
      .then((res) => res.json())
      .then((data) => roomSchema.parse(data))
  }
