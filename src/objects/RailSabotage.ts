import * as PIXI from 'pixi.js'

type RailSabotageType = 'broken'
export class RailSabotage {
  private app: PIXI.Application

  type: RailSabotageType
  timing: number
  repair_time: number
  repair_progress: number
  is_repaired: boolean

  constructor(
    app: PIXI.Application,
    type: RailSabotageType,
    timing: number,
    repair_time: number,
  ) {
    this.app = app

    this.type = type
    this.timing = timing
    this.repair_time = repair_time
    this.repair_progress = 0
    this.is_repaired = false
  }
}
