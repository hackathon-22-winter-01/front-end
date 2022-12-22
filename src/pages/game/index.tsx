import { useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import * as PIXI from 'pixi.js'
import { Game } from '/@/objects/Game'
import { styles } from './styles.css'
import { useEffect, useRef } from 'react'
import { wsManager } from '/@/lib/websocket'

const stateSchema = z
  .object({
    players: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    ),
    startedAt: z.string(),
  })
  .nullable()
export type State = z.infer<typeof stateSchema>

const app = new PIXI.Application({
  width: Game.WIDTH,
  height: Game.HEIGHT,
})

const GamePage: React.FC = () => {
  // todo
  const location = useLocation()
  const state = stateSchema.parse(location.state)

  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  if (state === undefined) {
    // TODO: 本番でいれる
    // navigate('/')
    console.warn('state is undefined')
  }

  // const { players, startedAt } = state!
  useEffect(() => {
    if (ref.current === null) return

    ref.current.appendChild(app.view as HTMLCanvasElement)

    const player_list = [
      {
        id: '0',
        name: 'player1',
      },
      {
        id: '1',
        name: 'player2',
      },
      {
        id: '2',
        name: 'player3',
      },
      {
        id: '3',
        name: 'player4',
      },
    ]
    const game = new Game(app, 4, wsManager, 0, player_list, '1')
    app.stage.addChild(game.render)

    app.resizeTo = ref.current

    return () => {
      app.stage.removeChild(game.render)
      // game.destroy()
    }
  })

  return (
    <div className={styles.pageContainer}>
      <div className={styles.gameContainer} ref={ref} />
      <h1>GamePage</h1>
    </div>
  )
}
export default GamePage
