import React, { useEffect } from 'react'
import { PlayerContext } from '../components/PlayerProvider'

const Room: React.FC = () => {
  const { player, setPlayer } = React.useContext(PlayerContext)
  useEffect(() => {
    console.log('Room')
  }, [])
  return (
    <div>
      <h1>Room</h1>
    </div>
  )
}

export default Room
