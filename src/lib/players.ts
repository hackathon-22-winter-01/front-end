import { useEffect, useState } from 'react'
import { useWsManager, WsReceive } from './websocket'

export const usePlayers = () => {
  const wsManager = useWsManager('ws://localhost:8080/ws')

  const [players, setPlayers] = useState<unknown[]>([])

  useEffect(() => {
    wsManager.connect()

    wsManager.eventTarget.addEventListener('message', (event) => {
      const e = event as CustomEvent<WsReceive>
      const data = e.detail

      switch (data.type) {
        case 'connected': {
          setPlayers(prev => [...prev, data.body.playerId])
          break
        }
        case '': {
          setPlayers(prev => prev.filter(playerId => playerId !== data.body.playerId))
          break
        }



    return () => {
      wsManager.disconnect()
    }
  })

}
