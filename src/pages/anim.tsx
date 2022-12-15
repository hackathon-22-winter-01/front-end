import * as PIXI from 'pixi.js'
import { useCallback, useEffect, useRef } from 'react'
import { Deque } from '../lib/deque'
import { EaseIn, EaseOut } from '../lib/easing'
import { CurveRail, StraightRail } from '../objects/Rail'
import reactLogo from './assets/react.svg'

const DELTA = 0.04

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
    const startTime = Date.now()
    while (true) {
      const now = Date.now()
      const diff_ms = now - startTime
      const tick_count = diff_ms / (1000 / 144)
      if (tick_count > 70) {
        break
      }

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

const createRailCurved = () => {
  const result = {
    to_right_merged: {
      rail: new PIXI.Graphics(),
      setFinished: () => {},
    },
    to_left_merged: {
      rail: new PIXI.Graphics(),
      setFinished: () => {},
    },
    to_right: {
      rail: new PIXI.Graphics(),
      setFinished: () => {},
    },
    to_left: {
      rail: new PIXI.Graphics(),
      setFinished: () => {},
    },
  }

  result.to_right_merged.setFinished = () => {
    result.to_right_merged.rail.clear()
    result.to_right_merged.rail.lineStyle(9, Color.rail.sleeper)
    result.to_right_merged.rail.moveTo(0, 7.5)
    result.to_right_merged.rail.lineTo(40, 7.5)
    result.to_right_merged.rail.moveTo(0, 20.5)
    result.to_right_merged.rail.lineTo(40, 20.5)
    result.to_right_merged.rail.moveTo(0, 33.5)
    result.to_right_merged.rail.lineTo(40, 33.5)

    result.to_right_merged.rail.lineStyle(8, Color.rail.rail)
    result.to_right_merged.rail.moveTo(9, 0)
    result.to_right_merged.rail.lineTo(9, 40)
    result.to_right_merged.rail.moveTo(31, 0)
    result.to_right_merged.rail.lineTo(31, 40)

    result.to_right_merged.rail.moveTo(9, 40)
    result.to_right_merged.rail.arc(
      40,
      40,
      31,
      Math.PI,
      (Math.PI * 3) / 2 + DELTA,
    )
    result.to_right_merged.rail.moveTo(31, 0)
    result.to_right_merged.rail.arc(
      40,
      40,
      9,
      Math.PI,
      (Math.PI * 3) / 2 + DELTA,
    )
  }
  result.to_right_merged.setFinished()

  result.to_left_merged.setFinished = () => {
    result.to_right_merged.rail.clear()
    result.to_right_merged.rail.lineStyle(9, Color.rail.sleeper)
    result.to_right_merged.rail.moveTo(0, 7.5)
    result.to_right_merged.rail.lineTo(40, 7.5)
    result.to_right_merged.rail.moveTo(0, 20.5)
    result.to_right_merged.rail.lineTo(40, 20.5)
    result.to_right_merged.rail.moveTo(0, 33.5)
    result.to_right_merged.rail.lineTo(40, 33.5)

    result.to_right_merged.rail.lineStyle(8, Color.rail.rail)
    result.to_right_merged.rail.moveTo(9, 0)
    result.to_right_merged.rail.lineTo(9, 40)
    result.to_right_merged.rail.moveTo(31, 0)
    result.to_right_merged.rail.lineTo(31, 40)

    result.to_right_merged.rail.moveTo(9, 40)
    result.to_right_merged.rail.arc(
      0,
      40,
      31,
      0,
      (Math.PI * 3) / 2 - DELTA,
      true,
    )
    result.to_right_merged.rail.moveTo(31, 0)
    result.to_right_merged.rail.arc(
      0,
      40,
      9,
      0,
      (Math.PI * 3) / 2 - DELTA,
      true,
    )
  }
  result.to_left_merged.setFinished()

  return result
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
      let rails = new Deque<StraightRail>()
      for (let i = 0; i < 10; i++) {
        const rail = new StraightRail()
        rail.render.x = 120
        rail.render.y = (9 - i) * 40
        rails.push(rail)
        container.addChild(rail.render)
        // app.stage.addChild(rail.rail)
      }
      const createRailAnimationLoop = () => {
        const start_time = Date.now()
        let hidden_rails = 0
        let base_time_diff = 0
        const loop = () => {
          const current_time = Date.now()
          const diff_ms = current_time - start_time
          const diff_cycle = diff_ms / (1000 / 144) / 3
          const mag = diff_cycle / diff_ms

          let distance_diff = diff_cycle - hidden_rails * 40
          while (distance_diff >= 40) {
            distance_diff -= 40
            hidden_rails += 1

            if (distance_diff < 30) {
              const rail = rails.pop_front()
              if (rail !== undefined) {
                rails.push(rail)
                rail.init_animation(30)
                rail.update_animation(distance_diff)
                let last_time = Date.now()
                const railAnimationLoop = () => {
                  const current_time = Date.now()
                  const diff_ms = current_time - last_time
                  last_time = current_time

                  const distance_diff = diff_ms * mag

                  if (!rail.update_animation(distance_diff)) {
                    app.ticker.remove(railAnimationLoop)
                  }
                }
                app.ticker.add(railAnimationLoop)
              }
            }
          }

          rails.toArray().forEach((rail, i) => {
            rail.render.y = (9 - i) * 40 + distance_diff
          })

          // if (distance_diff >= 40) {
          //   tick_count %= 40 * 3
          //   distance_diff = tick_count / 3
          //   const rail = rails.pop_front()
          //   if (rail !== undefined) {
          //     rails.push(rail)
          //     const railAnimation = rail.createAnimation()
          //     const railAnimationLoop = () => {
          //       const result = railAnimation.next()
          //       if (result.done) {
          //         app.ticker.remove(railAnimationLoop)
          //       }
          //     }
          //     app.ticker.add(railAnimationLoop)
          //   }
          // }

          // rails.toArray().forEach((rail, i) => {
          //   rail.rail.y = (9 - i) * 40 + distance_diff
          // })

          // tick_count += 1
        }
        return loop
      }
      app.ticker.add(createRailAnimationLoop())

      // container.scale.set(0.5)
      app.stage.addChild(container)

      {
        const rail2 = createRailCurved()
        rail2.to_right_merged.rail.x = 40
        rail2.to_right_merged.rail.y = 120
        rail2.to_right_merged.setFinished()
        app.stage.addChild(rail2.to_right_merged.rail)
      }
      {
        const rail2 = createRail()
        rail2.rail.x = 80
        rail2.rail.y = 120
        rail2.rail.rotation = Math.PI / 2
        rail2.rail.pivot.set(0, 40)
        rail2.setFinished()
        app.stage.addChild(rail2.rail)
      }

      {
        const rail2 = new StraightRail()
        rail2.render.x = 160
        rail2.render.y = 120
        app.stage.addChild(rail2.render)
      }
      {
        const rail2 = new CurveRail('bottom_right')
        rail2.render.x = 160
        rail2.render.y = 80
        app.stage.addChild(rail2.render)
      }

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
