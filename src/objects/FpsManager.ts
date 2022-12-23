import { Deque } from '../lib/deque'
import { Renderable } from './Renderable'
import * as PIXI from 'pixi.js'

export class FpsManager implements Renderable {
  private app: PIXI.Application
  private fps_deque: Deque<{
    time: number
    fps: number
  }> = new Deque()
  private container: PIXI.Container = new PIXI.Container()

  constructor(app: PIXI.Application) {
    this.app = app

    this.init_render()
  }

  get render() {
    return this.container
  }

  averageFps() {
    let sum = 0
    this.fps_deque.toArray().forEach(({ fps }) => {
      sum += fps
    })
    return sum / this.fps_deque.size
  }

  private init_render() {
    this.container.children.forEach((child) => {
      child.destroy()
    })
    this.app.ticker.remove(this.update, this)
    const text = new PIXI.Text('FPS: 0', {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xffffff,
      align: 'center',
    })
    this.container.addChild(text)

    this.app.ticker.add(this.update, this)
  }

  private update() {
    const now = performance.now()
    const fps = this.app.ticker.FPS
    this.fps_deque.push({ time: now, fps })
    while (this.fps_deque.size > 0) {
      const first = this.fps_deque.head!
      if (now - first.time > 1000) {
        this.fps_deque.pop_front()
      } else {
        break
      }
    }
    const avg = this.averageFps()
    const text = this.container.children[0] as PIXI.Text
    text.text = `FPS: ${avg.toFixed(2)}`
  }
}
