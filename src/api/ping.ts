import { Client } from '.'

export const ping = (client: Client) => async () => {
  const response = await fetch(`${client.baseUrl}/ping`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return response.text()
}
