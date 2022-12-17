import * as PIXI from 'pixi.js'
import { Rail } from './Rail'
import { Renderable } from './Renderanle'

export class Board implements Renderable {
  static readonly DEFAULT_MAX_HP = 100

  private app: PIXI.Application

  rails: Rail[]
  status: null // todo
  restHP: number
  maxHP: number

  container: PIXI.Container

  private static readonly railLayout = {
    width: 36,
    height: 800,
    gap_x: 36,
  }

  private static readonly zIndices = {
    background: 0,
    rails: 10,
    train: 20,
  }

  constructor(app: PIXI.Application) {
    this.app = app
    const layout = Board.railLayout

    this.rails = [
      new Rail(app, 0, layout),
      new Rail(app, 1, layout),
      new Rail(app, 2, layout),
      new Rail(app, 3, layout, true),
      new Rail(app, 4, layout),
      new Rail(app, 5, layout),
      new Rail(app, 6, layout),
    ]
    this.status = null
    this.restHP = 0
    this.maxHP = Board.DEFAULT_MAX_HP

    this.container = new PIXI.Container()
    this.container.sortableChildren = true
    this.init_render()
  }

  get render(): PIXI.DisplayObject {
    return this.container
  }

  private tick_handler?: () => void

  private init_render(): void {
    this.clear()
    if (this.tick_handler) {
      this.app.ticker.remove(this.tick_handler)
      this.tick_handler = undefined
    }
    const board = new PIXI.Graphics()
    board.beginFill(0xf9f5ea)
    board.drawRect(0, 0, 520, 800)
    board.endFill()
    board.zIndex = Board.zIndices.background
    this.container.addChild(board)

    this.rails.forEach((rail) => {
      rail.render.zIndex = Board.zIndices.rails
      this.container.addChild(rail.render)
    })

    const ContainerMask = new PIXI.Graphics()
    ContainerMask.beginFill(0xffffff)
    ContainerMask.drawRoundedRect(0, 0, 520, 800, 12)
    ContainerMask.endFill()
    this.container.addChild(ContainerMask)
    this.container.mask = ContainerMask
  }

  public update_render(timing_ms: number): void {
    this.rails.forEach((rail, idx) => {
      rail.update_render(timing_ms)
      rail.render.x =
        (520 - Board.railLayout.width * 7 - Board.railLayout.gap_x * 6) / 2 +
        idx * (Board.railLayout.width + Board.railLayout.gap_x)
    })
  }

  private clear(): void {
    this.container.children.forEach((child) => {
      child.destroy()
    })
  }
}
