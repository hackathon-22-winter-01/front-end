import { Client } from '.'

export const ws = (client: Client) => async () => {
  return await fetch(`${client.baseUrl}/ws`, {
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((res) => res.text())
}
