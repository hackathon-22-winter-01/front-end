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
        case 'connected': {
          setPlayers((prev) => [...prev, data.body.playerId])
          break
        }
        // case 'joined': {
        //   setPlayers((prev) => [...prev, data.body.playerId])
        //   break
        // }
        // case 'left': {
        //   setPlayers(prev => prev.filter(playerId => playerId !== data.body.playerId))
        //   break
        // }
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
