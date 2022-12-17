import React, { Dispatch, SetStateAction } from 'react'
import Player from '../lib/player'

interface PlayerContextProps {
  player: Player
  setPlayer: Dispatch<SetStateAction<Player>>
}

const PlayerContext = React.createContext<PlayerContextProps>({
  player: {
    id: '',
    name: '',
  },
  setPlayer: () => {},
})

interface Props {
  children: React.ReactNode
}

const PlayerProvider: React.FC<Props> = ({ children }) => {
  const [player, setPlayer] = React.useState<Player>({
    id: '',
    name: '',
  })

  return (
    <PlayerContext.Provider value={{ player, setPlayer }}>
      {children}
    </PlayerContext.Provider>
  )
}

export { PlayerContext, PlayerProvider }
