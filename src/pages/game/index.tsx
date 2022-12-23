import { useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import * as PIXI from 'pixi.js'
import { Game } from '/@/objects/Game'
import { styles } from './styles.css'
import { useEffect, useRef } from 'react'
import { wsManager } from '/@/lib/websocket'
import { FpsManager } from '/@/objects/FpsManager'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLDivElement>(null)
  if (state === undefined) {
    // TODO: 本番でいれる
    // navigate('/')
    console.warn('state is undefined')
  }

  // const { players, startedAt } = state!
  useEffect(() => {
    if (ref.current === null) return

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

    const container = containerRef.current
    if (container === null) return

    ref.current.appendChild(app.view as HTMLCanvasElement)
    const resize = () => {
      if (ref.current === null) return
      ref.current.removeChild(app.view as HTMLCanvasElement)

      const width = container.clientWidth
      const height = container.clientHeight

      let aspectedWidth = width
      let aspectedHeight = height
      if (width * Game.HEIGHT > height * Game.WIDTH) {
        aspectedWidth = (height * Game.WIDTH) / Game.HEIGHT
      } else {
        aspectedHeight = (width * Game.HEIGHT) / Game.WIDTH
      }

      app.stage.scale.set(aspectedWidth / Game.WIDTH)
      app.renderer.resize(aspectedWidth, aspectedHeight)

      ref.current.appendChild(app.view as HTMLCanvasElement)
    }
    resize()
    window.addEventListener('resize', resize)

    const fpsManager = new FpsManager(app)
    app.stage.addChild(fpsManager.render)
    fpsManager.render.position.set(10, 10)
    ;(fpsManager.render.children[0] as PIXI.Text).style.fill = 0xff0000

    return () => {
      app.stage.children.forEach((child) => {
        child.destroy()
      })
      // game.destroy()
      window.removeEventListener('resize', resize)
      if (ref.current === null) return
      ref.current.removeChild(app.view as HTMLCanvasElement)
    }
  })

  return (
    <div className={styles.pageContainer}>
      <div className={styles.gameWrap} ref={containerRef}>
        <div className={styles.gameContainer} ref={ref} />
      </div>
      <h1>GamePage</h1>
    </div>
  )
}
export default GamePage
