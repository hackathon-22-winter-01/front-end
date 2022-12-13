import * as PIXI from 'pixi.js'
import { useCallback, useEffect, useRef } from 'react'
import { Deque } from '../lib/deque'
import { EaseIn, EaseOut } from '../lib/easing'
import reactLogo from './assets/react.svg'

type ColorTree = {
  [key: string]: number | ColorTree
}
const Color = {
  rail: {
    sleeper: 0x85471f,
    rail: 0x583e30,
  },
} as const satisfies ColorTree

const straightWithAngle = (
  start: {
    x: number
    y: number
  },
  angle: number,
  length: number,
) => {
  const end = {
    x: start.x + length * Math.cos(angle),
    y: start.y + length * Math.sin(angle),
  }
  return end
}

const drawAngledRect = (
  g: PIXI.Graphics,
  left_top: { x: number; y: number },
  angle: number,
  width: number,
  height: number,
) => {
  const right_top = straightWithAngle(left_top, angle, width)
  const right_bottom = straightWithAngle(right_top, angle + Math.PI / 2, height)
  const left_bottom = straightWithAngle(left_top, angle + Math.PI / 2, height)
  g.drawPolygon([
    left_top.x,
    left_top.y,
    right_top.x,
    right_top.y,
    right_bottom.x,
    right_bottom.y,
    left_bottom.x,
    left_bottom.y,
  ])
}

const app = new PIXI.Application({
  width: 400,
  height: 400,
  backgroundColor: 0x1099bb,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
})

type railController = ReturnType<typeof createRail>
const createRail = () => {
  let rail = new PIXI.Graphics()
  // 40 * 40
  const setFinished = () => {
    rail.clear()

    rail.lineStyle(9, Color.rail.sleeper)
    rail.moveTo(0, 7.5)
    rail.lineTo(40, 7.5)
    rail.moveTo(0, 20.5)
    rail.lineTo(40, 20.5)
    rail.moveTo(0, 33.5)
    rail.lineTo(40, 33.5)

    rail.lineStyle(8, Color.rail.rail)
    rail.moveTo(9, 0)
    rail.lineTo(9, 40)
    rail.moveTo(31, 0)
    rail.lineTo(31, 40)
  }

  const createAnimation = function* () {
    let tick_count = 0
    while (tick_count <= 70) {
      rail.clear()
      rail.beginFill(Color.rail.sleeper)
      if (tick_count < 30) {
        const ease = EaseOut.range(tick_count, 30)
        rail.drawRect(ease([20, 0]), 29, ease([45, 40]), 9)
      } else {
        rail.drawRect(0, 29, 40, 9)
      }

      if (tick_count < 10) {
        // nop
      } else if (tick_count < 40) {
        const ease = EaseOut.range(tick_count - 10, 30)
        rail.drawRect(ease([20, 0]), 16, ease([45, 40]), 9)
      } else {
        rail.drawRect(0, 16, 40, 9)
      }

      if (tick_count < 20) {
        // nop
      } else if (tick_count < 50) {
        const ease = EaseOut.range(tick_count - 20, 30)
        rail.drawRect(ease([20, 0]), 3, ease([45, 40]), 9)
      } else {
        rail.drawRect(0, 3, 40, 9)
      }
      rail.endFill()

      rail.beginFill(Color.rail.rail)
      if (tick_count < 40) {
        // nop
      } else if (tick_count < 50) {
        const ease = EaseIn.range(tick_count - 40, 10)
        rail.drawRect(5, ease([-6, 4]), 8, ease([43, 38]))
        rail.drawRect(27, ease([-6, 4]), 8, ease([43, 38]))
      } else if (tick_count < 60) {
        const ease = EaseOut.range(tick_count - 50, 10)
        rail.drawRect(5, ease([4, -3]), 8, ease([38, 41]))
        rail.drawRect(27, ease([4, -3]), 8, ease([38, 41]))
      } else if (tick_count < 70) {
        const ease = EaseIn.range(tick_count - 60, 10)
        rail.drawRect(5, ease([-3, 0]), 8, ease([41, 40]))
        rail.drawRect(27, ease([-3, 0]), 8, ease([41, 40]))
      } else {
        rail.drawRect(5, 0, 8, 40)
        rail.drawRect(27, 0, 8, 40)
      }
      rail.endFill()

      yield true
      tick_count += 1
    }
    setFinished()
    return false
  }

  return {
    rail,
    setFinished,
    createAnimation,
  }
}

const Anim: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.appendChild(app.view as HTMLCanvasElement)
      const reactIcon = PIXI.Sprite.from(reactLogo)
      reactIcon.anchor.set(0.5)
      reactIcon.x = app.screen.width / 2
      reactIcon.y = app.screen.height / 2
      reactIcon.interactive = true
      reactIcon.on('pointerdown', changeColor)
      reactIcon.cursor = 'pointer'

      const container = new PIXI.Container()
      container.width = 400
      container.height = 400
      let rails = new Deque<railController>()
      for (let i = 0; i < 10; i++) {
        const rail = createRail()
        rail.rail.x = 100
        rail.rail.y = (9 - i) * 40
        rails.push(rail)
        rail.setFinished()
        container.addChild(rail.rail)
        // app.stage.addChild(rail.rail)
      }
      const createRailAnimationLoop = () => {
        let tick_count = 0
        const loop = () => {
          let distance_diff = tick_count / 3
          if (distance_diff >= 40) {
            tick_count %= 40 * 3
            distance_diff = tick_count / 3
            const rail = rails.pop_front()
            if (rail !== undefined) {
              rails.push(rail)
              const railAnimation = rail.createAnimation()
              const railAnimationLoop = () => {
                const result = railAnimation.next()
                if (result.done) {
                  app.ticker.remove(railAnimationLoop)
                }
              }
              app.ticker.add(railAnimationLoop)
            }
          }

          rails.toArray().forEach((rail, i) => {
            rail.rail.y = (9 - i) * 40 + distance_diff
          })

          tick_count += 1
        }
        return loop
      }
      app.ticker.add(createRailAnimationLoop())

      // container.scale.set(0.5)
      app.stage.addChild(container)

      const rotate = () => {
        reactIcon.rotation += 0.1
      }
      app.ticker.add(rotate)

      app.stage.addChild(reactIcon)

      app.start()

      return () => {
        app.stop()
        ref.current?.removeChild(app.view as HTMLCanvasElement)
      }
    }
  }, [ref])

  const changeColor = useCallback(() => {
    ;(app.renderer as PIXI.Renderer).backgroundColor = Math.random() * 0xffffff
  }, [])

  return (
    <div>
      <div ref={ref} />
      <button onClick={changeColor}>Change color</button>
    </div>
  )
}
export default Anim
