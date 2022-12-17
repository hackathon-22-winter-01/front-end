import { Client } from '.'

export const ws = (client: Client) => async (playerId: string) => {
  return await fetch(`${client.baseUrl}/ws?playerId=${playerId}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((res) => res.text())
}
