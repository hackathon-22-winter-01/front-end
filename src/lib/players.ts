import { useEffect, useState } from 'react'
import { WsReceive } from '../api/ws/schema'
import { wsManager, wsManagerEventTarget } from './websocket'

export const usePlayers = () => {
  const [players, setPlayers] = useState<unknown[]>([])

  useEffect(() => {
    wsManager.connect()

    const messageHandler = (event: Event) => {
      const e = event as CustomEvent<WsReceive>
      const data = e.detail

      switch (data.type) {
        case 'joined': {
          setPlayers(data.body.players)
          break
        }
        case 'left': {
          setPlayers(data.body.players)
          break
        }
      }
    }
    wsManagerEventTarget.addEventListener('message', messageHandler)

    return () => {
      wsManagerEventTarget.removeEventListener('message', messageHandler)
    }
  })

  return {
    players,
  }
}
