import * as PIXI from 'pixi.js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { EaseIn, EaseOut } from '../lib/easing'
import reactLogo from './assets/react.svg'

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
  width: 256,
  height: 256,
  backgroundColor: 0x1099bb,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
})

const createRail = () => {
  let rail = new PIXI.Graphics()
  // 40 * 40
  const setFinished = () => {
    rail.clear()

    rail.beginFill(0x85471f)
    rail.drawRect(0, 3, 40, 9)
    rail.drawRect(0, 16, 40, 9)
    rail.drawRect(0, 29, 40, 9)
    rail.endFill()

    rail.beginFill(0x583e30)
    rail.drawRect(5, 0, 8, 40)
    rail.drawRect(27, 0, 8, 40)
    rail.endFill()
  }

  const createAnimation = function* () {
    let tick_count = 0
    while (tick_count <= 70) {
      rail.clear()
      rail.beginFill(0x85471f)
      if (tick_count < 30) {
        const ease = EaseOut.range(tick_count, 30)
        const baseAngle = ease([210, 180]) * (Math.PI / 180)
        drawAngledRect(rail, { x: 40, y: 12 }, baseAngle, 40, 9)
      } else {
        rail.drawRect(0, 3, 40, 9)
      }
      if (tick_count < 40) {
        if (tick_count >= 10) {
          const ease = EaseOut.range(tick_count - 10, 30)
          const baseAngle = ease([-120, -90]) * (Math.PI / 180)
          drawAngledRect(rail, { x: 0, y: 25 }, baseAngle, 9, 40)
        }
      } else {
        rail.drawRect(0, 16, 40, 9)
      }
      if (tick_count < 50) {
        if (tick_count >= 20) {
          const ease = EaseOut.range(tick_count - 20, 30)
          const baseAngle = ease([210, 180]) * (Math.PI / 180)
          drawAngledRect(rail, { x: 40, y: 38 }, baseAngle, 40, 9)
        }
      } else {
        rail.drawRect(0, 29, 40, 9)
      }
      rail.endFill()

      rail.beginFill(0x583e30)
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

      const { rail, createAnimation } = createRail()
      rail.x = 50
      rail.y = 50

      let railAnimation = createAnimation()
      const railAnimationLoop = () => {
        const result = railAnimation.next()
        if (result.done) {
          railAnimation = (function* () {
            while (true) {
              yield false
            }
          })()
          setTimeout(() => {
            railAnimation = createAnimation()
          }, 1000)
          // railAnimation = createAnimation()
          // app.ticker.remove(railAnimationLoop)
        }
      }
      app.ticker.add(railAnimationLoop)

      app.stage.addChild(rail)

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
