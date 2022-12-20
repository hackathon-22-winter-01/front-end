import * as PIXI from 'pixi.js'
import { PressProgressManager } from '../lib/pressManager'
import { Renderable } from './Renderable'

const difficulty_need_time_mapping = {
  1: 1000,
  2: 1500,
  3: 2000,
  4: 2500,
  5: 3000,
} as const satisfies {
  [key in 1 | 2 | 3 | 4 | 5]: number
}

type RailSabotageType = 'broken'
export class RailSabotage implements Renderable {
  private app: PIXI.Application

  private container: PIXI.Container

  type: RailSabotageType
  readonly timing: number
  // repair_time: number
  // repair_progress: number
  // is_repaired: boolean
  private damage: number
  private difficulty: number

  readonly progress_manager: PressProgressManager

  constructor(
    app: PIXI.Application,
    type: RailSabotageType,
    timing: number,
    damage: number,
    difficulty: number,
  ) {
    this.app = app

    this.type = type
    this.timing = timing
    this.damage = damage
    this.difficulty = difficulty

    this.progress_manager = new PressProgressManager(app, this.needTime_ms)

    this.progress_manager.pressed = this.trigger_repair.bind(this)

    this.container = new PIXI.Container()
    this.init_render()
  }

  private repaired_handler?: () => void
  private crashed_handler?: () => void
  set repaired(handler: () => void) {
    this.repaired_handler = handler
  }
  set crashed(handler: () => void) {
    this.crashed_handler = handler
  }

  get needTime_ms(): number {
    return difficulty_need_time_mapping[
      this.difficulty as keyof typeof difficulty_need_time_mapping
    ]
  }

  public trigger_crash(): void {
    this.crashed_handler?.()

    this.repaired_handler = undefined
    this.crashed_handler = undefined
  }
  public trigger_repair(): void {
    this.repaired_handler?.()

    this.repaired_handler = undefined
    this.crashed_handler = undefined
  }

  get render(): PIXI.Container {
    return this.container
  }

  private init_render(): void {
    this.container.removeChildren()

    const RockUnder = new PIXI.Graphics()
    RockUnder.beginFill(0xc6d4d9)
    RockUnder.lineStyle(2, 0x000000)
    RockUnder.drawRect(0, 0, 60, 50)
    RockUnder.endFill()
    const RockUpper = new PIXI.Graphics()
    RockUpper.beginFill(0x9ba8ad)
    RockUpper.lineStyle(2, 0x000000)
    RockUpper.drawRect(0, 0, 30, 20)
    RockUpper.endFill()

    const Rock = new PIXI.Container()
    Rock.addChild(RockUnder)
    Rock.addChild(RockUpper)
    RockUnder.x = 0
    RockUnder.y = 5
    RockUpper.x = 15
    RockUpper.y = 0

    // now 60 x 55
    // like 40 x 40
    this.container.pivot.set(10, 15 / 2)

    this.container.addChild(Rock)
  }
}
