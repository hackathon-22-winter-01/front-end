import * as PIXI from 'pixi.js'
import { WsManager } from '../lib/websocket'

export class Game {
  private app: PIXI.Application

  myBoard: Board
  enemyBoard: Board[]
  wsManager: WsManager

  constructor(app: PIXI.Application, playerNum: number, wsManager: WsManager) {
    this.app = app

    this.myBoard = new Board(app)
    this.enemyBoard = Array.from(
      { length: playerNum - 1 },
      () => new Board(app),
    )
    this.wsManager = wsManager
  }
}

export class Card {
  private app: PIXI.Application

  constructor(app: PIXI.Application) {
    this.app = app
  }
}

export class Board {
  static readonly DEFAULT_MAX_HP = 100

  private app: PIXI.Application

  rails: Rail[]
  status: null // todo
  restHP: number
  maxHP: number

  constructor(app: PIXI.Application) {
    this.app = app

    this.rails = [
      new Rail(app),
      new Rail(app),
      new Rail(app),
      new Rail(app, true),
      new Rail(app),
      new Rail(app),
    ]
    this.status = null
    this.restHP = 0
    this.maxHP = Board.DEFAULT_MAX_HP
  }
}

type RailRelationLog =
  | {
      type: 'branched'
      from: number
      timing: number
    }
  | {
      type: 'merged'
      to: number
      timing: number
    }
  | {
      type: 'initialized'
    }
export class Rail {
  private app: PIXI.Application

  statuses: RailSabotage[]
  relation_log: RailRelationLog[]

  constructor(app: PIXI.Application, is_root: boolean = false) {
    this.app = app

    this.statuses = []
    this.relation_log = is_root ? [{ type: 'initialized' }] : []
  }
}

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
