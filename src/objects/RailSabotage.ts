import * as PIXI from 'pixi.js'
import { PressProgressManager } from '../lib/pressManager'

const difficulty_need_time_mapping = {
  1: 1000,
  2: 1500,
  3: 2000,
  4: 2500,
  5: 3000,
} as const satisfies {
  1: number
  2: number
  3: number
  4: number
  5: number
}

type RailSabotageType = 'broken'
export class RailSabotage {
  private app: PIXI.Application

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
}
