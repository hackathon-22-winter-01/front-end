import { Client } from '.'

export const ping = (client: Client) => async () => {
  return await fetch(`${client.baseUrl}/ping`, {
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((res) => res.text())
}
