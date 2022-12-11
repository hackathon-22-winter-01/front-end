import * as PIXI from 'pixi.js'
import { useCallback, useEffect, useRef } from 'react'

const app = new PIXI.Application({
  width: 256,
  height: 256,
  backgroundColor: 0x1099bb,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
})

const Anim: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.appendChild(app.view as HTMLCanvasElement)
      const reactIcon = PIXI.Sprite.from('https://reactjs.org/logo-og.png')
      reactIcon.anchor.set(0.5)
      reactIcon.x = app.screen.width / 2
      reactIcon.y = app.screen.height / 2
      app.stage.addChild(reactIcon)

      app.start()

      return () => {
        app.stop()
        ref.current?.removeChild(app.view as HTMLCanvasElement)
      }
    }
  }, [ref])

  const changeColor = useCallback(() => {
    app.renderer.backgroundColor = Math.random() * 0xffffff
  }, [])

  return (
    <div>
      <div ref={ref} />
      <button onClick={changeColor}>Change color</button>
    </div>
  )
}
export default Anim
