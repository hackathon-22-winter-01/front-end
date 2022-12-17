import * as PIXI from 'pixi.js'
import { RailSabotage } from './RailSabotage'
import { Renderable } from './Renderanle'

const TRAIN_SPEED = 40

type RailRelationLog =
  | {
      type: 'branched'
      fromIdx: number
      timing: number
    }
  | {
      type: 'merged'
      toIdx: number
      timing: number
    }
  | {
      type: 'initialized'
    }
export class Rail implements Renderable {
  private app: PIXI.Application

  private index: number

  statuses: RailSabotage[]
  relation_log: RailRelationLog[]

  private container: PIXI.Container

  private height: number
  private width: number
  private gap_x: number

  constructor(
    app: PIXI.Application,
    index: number,
    layout: {
      height: number
      width: number
      gap_x: number
    },
    is_root: boolean = false,
  ) {
    this.app = app

    this.index = index

    this.statuses = []
    this.relation_log = is_root ? [{ type: 'initialized' }] : []

    this.container = new PIXI.Container()

    this.height = layout.height
    this.width = layout.width
    this.gap_x = layout.gap_x
  }

  get render(): PIXI.DisplayObject {
    return this.container
  }

  private static readonly topMargin = [90, 150, 40, 0, 50, 100, 20] as const

  public update_render(timing_ms: number): void {
    class OneRailTmp implements Renderable {
      private app: PIXI.Application

      private container: PIXI.Container

      constructor(app: PIXI.Application) {
        this.app = app

        this.container = new PIXI.Container()
        this.init_render()
      }

      get render(): PIXI.DisplayObject {
        return this.container
      }

      private init_render(): void {
        this.clear()
        const rail = PIXI.Sprite.from(PIXI.Texture.WHITE)
        rail.width = 40
        rail.height = 40
        rail.tint = 0x85471f
        this.container.addChild(rail)
      }

      private clear(): void {
        this.container.children.forEach((child) => {
          child.destroy()
        })
      }
    }

    this.clear()
    const railPx = this.width

    const railCount = this.height / railPx
    const diffDelta = ((timing_ms * TRAIN_SPEED) / 1000) % railPx
    const topMargin =
      (this.height % railPx) + diffDelta + Rail.topMargin[this.index]

    for (let i = 0; i < railCount; i++) {
      const oneRail = new OneRailTmp(this.app)
      oneRail.render.position.set(0, topMargin + railPx * i)
      this.container.addChild(oneRail.render)
    }
  }

  private clear(): void {
    this.container.children.forEach((child) => {
      child.destroy()
    })
  }
}
